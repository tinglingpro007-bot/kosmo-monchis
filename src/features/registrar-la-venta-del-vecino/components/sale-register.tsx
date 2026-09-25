"use client";

import { useState, useTransition } from "react";
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast, ToastContainer } from "@/components/ui/toast";

import { registrarVentaAction } from "../actions";
import {
  agregarLinea,
  buscarProductos,
  calcularTotal,
  formatearMoneda,
  listarCategorias,
  MENSAJES,
  quitarLinea,
  validarVenta,
  type LineaVenta,
  type ProductoCatalogo,
} from "../logic";
import { ProductCard } from "./product-card";

interface SaleRegisterProps {
  productos: ProductoCatalogo[];
  vendedorId: string;
  vendedorNombre: string;
}

interface Mensaje {
  variant: "success" | "danger" | "warning" | "info";
  text: string;
}

export function SaleRegister({ productos, vendedorId, vendedorNombre }: SaleRegisterProps) {
  const [termino, setTermino] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [carrito, setCarrito] = useState<LineaVenta[]>([]);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categorias = listarCategorias(productos);
  const resultadosBusqueda = buscarProductos(productos, termino);
  const filtrados = resultadosBusqueda.filter(
    (producto) => categoria === "todas" || producto.categoria === categoria,
  );
  const sinResultados = termino.trim() !== "" && resultadosBusqueda.length === 0;
  const total = calcularTotal(carrito);

  const handleAgregar = (producto: ProductoCatalogo) => {
    const cantidad = Number(cantidades[producto.id] ?? "1");
    const resultado = agregarLinea(carrito, producto, cantidad);
    if (!resultado.ok) {
      setMensaje({ variant: "danger", text: resultado.error });
      return;
    }
    setCarrito(resultado.carrito);
    setMensaje(null);
    setCantidades((previas) => ({ ...previas, [producto.id]: "1" }));
  };

  const handleQuitar = (productoId: string) => {
    setCarrito((previo) => quitarLinea(previo, productoId));
  };

  const handleConfirmar = () => {
    const validacion = validarVenta(carrito, productos);
    if (!validacion.ok) {
      setConfirmOpen(false);
      setMensaje({ variant: "danger", text: validacion.error });
      return;
    }

    startTransition(async () => {
      const resultado = await registrarVentaAction({
        vendedorId,
        vendedorNombre,
        lineas: carrito,
      });
      setConfirmOpen(false);
      if (resultado.success) {
        setCarrito([]);
        setMensaje({ variant: "success", text: MENSAJES.ventaOk });
        setToast(`${MENSAJES.ventaOk} Total ${formatearMoneda(resultado.total)}`);
      } else {
        setMensaje({ variant: "danger", text: resultado.error });
      }
    });
  };

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <Card>
          <CardBody className="d-flex flex-column gap-3">
            <div className="row g-2">
              <div className="col-12 col-md-7">
                <Label htmlFor="buscar-producto">Buscar en el catálogo</Label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Search size={16} />
                  </span>
                  <Input
                    id="buscar-producto"
                    placeholder="Nombre o código del producto"
                    value={termino}
                    onChange={(evento) => setTermino(evento.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-5">
                <Label htmlFor="filtro-categoria">Categoría</Label>
                <Select
                  id="filtro-categoria"
                  value={categoria}
                  onChange={(evento) => setCategoria(evento.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  {categorias.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {sinResultados ? (
              <Alert variant="warning" title="Sin coincidencias">
                {MENSAJES.noExiste}
              </Alert>
            ) : null}
          </CardBody>
        </Card>

        <div className="row g-3 mt-1 row-cols-1 row-cols-sm-2 row-cols-xl-3">
          {filtrados.map((producto) => (
            <div key={producto.id} className="col">
              <ProductCard
                producto={producto}
                action={
                  <div className="d-flex align-items-end gap-2">
                    <div className="flex-grow-1">
                      <Label htmlFor={`cantidad-${producto.id}`}>Cantidad</Label>
                      <Input
                        id={`cantidad-${producto.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={cantidades[producto.id] ?? "1"}
                        onChange={(evento) =>
                          setCantidades((previas) => ({
                            ...previas,
                            [producto.id]: evento.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleAgregar(producto)}
                      aria-label={`Agregar ${producto.nombre}`}
                    >
                      <Plus size={16} />
                      Agregar
                    </Button>
                  </div>
                }
              />
            </div>
          ))}
        </div>

        {filtrados.length === 0 && !sinResultados ? (
          <div className="mt-3">
            <EmptyState
              icon={Search}
              title="No hay productos para este filtro"
              description="Prueba con otra categoría o limpia la búsqueda."
            />
          </div>
        ) : null}
      </div>

      <div className="col-lg-4">
        <Card className="sticky-top" style={{ top: "5.5rem" }}>
          <CardHeader className="d-flex align-items-center justify-content-between pt-3">
            <CardTitle className="d-flex align-items-center gap-2 mb-0">
              <ShoppingCart size={18} className="text-primary" />
              Venta en curso
            </CardTitle>
            <span className="badge bg-primary-subtle text-primary-emphasis">
              {carrito.length} {carrito.length === 1 ? "producto" : "productos"}
            </span>
          </CardHeader>
          <CardBody className="d-flex flex-column gap-3">
            {mensaje ? (
              <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
            ) : null}

            {carrito.length === 0 ? (
              <p className="text-muted small mb-0">
                Agrega productos del catálogo para iniciar la venta del vecino.
              </p>
            ) : (
              <ul className="list-group list-group-flush">
                {carrito.map((linea) => (
                  <li key={linea.productoId} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-dark text-truncate">{linea.nombre}</div>
                        <div className="small text-muted">
                          {linea.codigo} · {linea.cantidad} × {formatearMoneda(linea.precioUnitario)}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-dark">
                          {formatearMoneda(linea.subtotal)}
                        </span>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => handleQuitar(linea.productoId)}
                          aria-label={`Eliminar ${linea.nombre}`}
                        >
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="d-flex justify-content-between align-items-center border-top pt-3">
              <span className="text-secondary fw-medium">Total</span>
              <span className="h4 fw-bold text-primary mb-0">{formatearMoneda(total)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-100"
              disabled={carrito.length === 0 || isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {isPending ? "Registrando..." : "Confirmar venta"}
            </Button>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar venta"
        footer={
          <>
            <Button variant="light" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmar} disabled={isPending}>
              {isPending ? "Registrando..." : "Sí, confirmar"}
            </Button>
          </>
        }
      >
        <p className="text-secondary mb-2">
          Se registrarán {carrito.length} {carrito.length === 1 ? "producto" : "productos"} a nombre
          de <strong>{vendedorNombre}</strong>.
        </p>
        <div className="d-flex justify-content-between align-items-center border-top pt-3">
          <span className="fw-medium">Total a cobrar</span>
          <span className="h5 fw-bold text-primary mb-0">{formatearMoneda(total)}</span>
        </div>
      </Modal>

      {toast ? (
        <ToastContainer position="top-end">
          <Toast title={MENSAJES.ventaOk} description={toast} variant="success" onClose={() => setToast(null)} />
        </ToastContainer>
      ) : null}
    </div>
  );
}
