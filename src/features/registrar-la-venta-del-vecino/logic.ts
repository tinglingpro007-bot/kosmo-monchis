import { estaVencido } from "@/domain/productos";

/** Producto del catálogo tal como lo consumen la UI y las validaciones. */
export interface ProductoCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  unidadMedida: string;
  nivelMinimo: number;
  fechaCaducidad: Date | null;
  cantidadDisponible: number;
}

/** Línea de venta agregada al carrito en curso. */
export interface LineaVenta {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Ítem de una venta ya registrada, para el historial del día. */
export interface VentaItemResumen {
  codigo: string;
  nombre: string;
  cantidad: number;
  subtotal: number;
}

/** Venta registrada con su detalle, mostrada en el historial. */
export interface VentaDelDia {
  id: string;
  fecha: Date;
  vendedorNombre: string;
  total: number;
  items: VentaItemResumen[];
}

export type ResultadoCarrito =
  | { ok: true; carrito: LineaVenta[] }
  | { ok: false; error: string };

export const MENSAJES = {
  noExiste: "No existe un producto registrado con ese nombre",
  vencido: "El producto está vencido y no puede venderse",
  cantidadInvalida: "La cantidad ingresada no es válida o supera las existencias disponibles",
  carritoVacio: "Debe agregar al menos un producto a la venta",
  ventaOk: "Venta registrada correctamente",
} as const;

export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(valor);
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Filtra el catálogo por nombre o código (REQ-1.1). */
export function buscarProductos(
  catalogo: readonly ProductoCatalogo[],
  termino: string,
): ProductoCatalogo[] {
  const busqueda = normalizar(termino);
  if (busqueda === "") return [...catalogo];
  return catalogo.filter(
    (producto) =>
      normalizar(producto.nombre).includes(busqueda) ||
      normalizar(producto.codigo).includes(busqueda),
  );
}

/** Categorías disponibles en el catálogo, ordenadas alfabéticamente. */
export function listarCategorias(catalogo: readonly ProductoCatalogo[]): string[] {
  return [...new Set(catalogo.map((producto) => producto.categoria))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Agrega una línea al carrito aplicando todas las reglas de venta:
 * producto existente, vigente y cantidad válida con existencias suficientes.
 */
export function agregarLinea(
  carrito: readonly LineaVenta[],
  producto: ProductoCatalogo | undefined,
  cantidad: number,
  hoy: Date = new Date(),
): ResultadoCarrito {
  if (!producto) return { ok: false, error: MENSAJES.noExiste };
  if (estaVencido(producto, hoy)) return { ok: false, error: MENSAJES.vencido };

  const existente = carrito.find((linea) => linea.productoId === producto.id);
  const cantidadAcumulada = (existente?.cantidad ?? 0) + cantidad;
  const cantidadValida = Number.isInteger(cantidad) && cantidad > 0;
  if (!cantidadValida || cantidadAcumulada > producto.cantidadDisponible) {
    return { ok: false, error: MENSAJES.cantidadInvalida };
  }

  if (existente) {
    return {
      ok: true,
      carrito: carrito.map((linea) =>
        linea.productoId === producto.id
          ? {
              ...linea,
              cantidad: cantidadAcumulada,
              subtotal: redondear2(cantidadAcumulada * producto.precioVenta),
            }
          : linea,
      ),
    };
  }

  return {
    ok: true,
    carrito: [
      ...carrito,
      {
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: redondear2(cantidad * producto.precioVenta),
      },
    ],
  };
}

/** Elimina una línea del carrito en curso (REQ-1.8). */
export function quitarLinea(
  carrito: readonly LineaVenta[],
  productoId: string,
): LineaVenta[] {
  return carrito.filter((linea) => linea.productoId !== productoId);
}

/** Suma de cantidad por precio vigente de cada línea (REQ-1.7). */
export function calcularTotal(carrito: readonly LineaVenta[]): number {
  return redondear2(carrito.reduce((total, linea) => total + linea.subtotal, 0));
}

/** Valida la venta completa antes de confirmar (REQ-1.4 y REQ-1.9). */
export function validarVenta(
  carrito: readonly LineaVenta[],
  catalogo: readonly ProductoCatalogo[],
  hoy: Date = new Date(),
): { ok: true } | { ok: false; error: string } {
  if (carrito.length === 0) return { ok: false, error: MENSAJES.carritoVacio };

  for (const linea of carrito) {
    const producto = catalogo.find((candidato) => candidato.id === linea.productoId);
    if (!producto) return { ok: false, error: MENSAJES.noExiste };
    if (estaVencido(producto, hoy)) return { ok: false, error: MENSAJES.vencido };
    if (linea.cantidad > producto.cantidadDisponible) {
      return { ok: false, error: `Las existencias de ${producto.nombre} no son suficientes` };
    }
  }

  return { ok: true };
}
