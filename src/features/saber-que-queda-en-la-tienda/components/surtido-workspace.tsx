"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Store, Truck } from "lucide-react";

import type { Producto } from "@/db/schema";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, type TabItem } from "@/components/ui/tabs";

import {
  CATEGORIA_TODAS,
  filtrarSurtido,
  listarCategoriasSurtido,
  resumenSurtido,
  type FiltroSurtido,
} from "../logic";
import { ExistenciaCard } from "./existencia-card";
import { ExistenciaDetalleModal } from "./existencia-detalle-modal";

interface SurtidoWorkspaceProps {
  productos: Producto[];
}

const FILTRO_INICIAL: FiltroSurtido = {
  texto: "",
  categoria: CATEGORIA_TODAS,
  soloBajoMinimo: false,
};

export function SurtidoWorkspace({ productos }: SurtidoWorkspaceProps) {
  const router = useRouter();
  const [rol, setRol] = useState("dueno");
  const [filtro, setFiltro] = useState<FiltroSurtido>(FILTRO_INICIAL);
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);

  // ponytail: refresco por sondeo para reflejar ventas hechas en otra pantalla
  // (REQ-2.7); si se necesita tiempo real estricto, migrar a SSE/websocket.
  useEffect(() => {
    const intervalo = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(intervalo);
  }, [router]);

  const categorias = useMemo(() => listarCategoriasSurtido(productos), [productos]);
  const visibles = useMemo(() => filtrarSurtido(productos, filtro), [productos, filtro]);
  const resumen = useMemo(() => resumenSurtido(productos), [productos]);

  const tabs: TabItem[] = [
    { id: "dueno", label: "Dueño de la tienda", icon: <Truck size={16} /> },
    { id: "vendedor", label: "Vendedor de mostrador", icon: <Store size={16} /> },
  ];

  const catalogoVacio = productos.length === 0;

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        title="Saber qué queda en la tienda"
        description="Consulta el surtido completo y las unidades disponibles de cada producto, actualizadas con cada entrada, salida y ajuste."
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <Tabs items={tabs} activeId={rol} onChange={setRol} variant="pills" />
        <div className="d-flex flex-wrap gap-2">
          <span className="badge rounded-pill bg-light text-dark border">
            {resumen.total} productos
          </span>
          <span className="badge rounded-pill bg-light text-dark border">
            {resumen.unidades} unidades
          </span>
          <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
            {resumen.bajoMinimo} bajo el mínimo
          </span>
          <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis border border-danger-subtle">
            {resumen.agotados} agotados
          </span>
        </div>
      </div>

      <Card>
        <CardBody className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <Label htmlFor="surtido-buscar">Buscar producto</Label>
            <Input
              id="surtido-buscar"
              placeholder="Nombre o código"
              value={filtro.texto}
              onChange={(evento) => setFiltro({ ...filtro, texto: evento.target.value })}
            />
          </div>
          <div className="col-12 col-md-4">
            <Label htmlFor="surtido-categoria">Categoría</Label>
            <Select
              id="surtido-categoria"
              value={filtro.categoria}
              onChange={(evento) => setFiltro({ ...filtro, categoria: evento.target.value })}
            >
              <option value={CATEGORIA_TODAS}>Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-12 col-md-3">
            <Switch
              id="surtido-minimo"
              label="Solo productos bajo el mínimo"
              checked={filtro.soloBajoMinimo}
              onChange={(evento) =>
                setFiltro({ ...filtro, soloBajoMinimo: evento.target.checked })
              }
            />
          </div>
        </CardBody>
      </Card>

      {catalogoVacio ? (
        <EmptyState
          icon={PackageSearch}
          title="Aún no hay productos registrados en el catálogo"
          description="Cuando registres productos, aquí verás cuántas unidades quedan de cada uno."
        />
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No hay productos que coincidan con el filtro"
          description="Prueba con otro nombre, cambia la categoría o desactiva el filtro de mínimo."
        />
      ) : (
        <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3">
          {visibles.map((producto) => (
            <div key={producto.id} className="col">
              <ExistenciaCard producto={producto} onSelect={setSeleccionado} />
            </div>
          ))}
        </div>
      )}

      <ExistenciaDetalleModal
        producto={seleccionado}
        puedeRegistrar={rol === "dueno"}
        onClose={() => setSeleccionado(null)}
      />
    </div>
  );
}
