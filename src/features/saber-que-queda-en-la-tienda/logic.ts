import type { Producto } from "@/db/schema";
import { calcularAlertasReposicion } from "@/domain/productos";

/** Criterios activos de la vista del surtido. */
export interface FiltroSurtido {
  texto: string;
  categoria: string;
  soloBajoMinimo: boolean;
}

/** Conteos que resumen el estado del surtido. */
export interface ResumenSurtido {
  total: number;
  unidades: number;
  bajoMinimo: number;
  agotados: number;
}

export const CATEGORIA_TODAS = "todas";

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Un producto está señalado cuando su cantidad alcanza o baja el mínimo (REQ-2.4). */
export function esBajoMinimo(
  producto: Pick<Producto, "cantidadDisponible" | "nivelMinimo">,
): boolean {
  return producto.cantidadDisponible <= producto.nivelMinimo;
}

/** Categorías presentes en el surtido, ordenadas alfabéticamente. */
export function listarCategoriasSurtido(productos: readonly Producto[]): string[] {
  return [...new Set(productos.map((producto) => producto.categoria))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Aplica búsqueda por nombre/código, categoría y el filtro opcional
 * "Solo productos bajo el mínimo" (REQ-2.3 y REQ-2.5).
 */
export function filtrarSurtido(
  productos: readonly Producto[],
  filtro: FiltroSurtido,
): Producto[] {
  const termino = normalizar(filtro.texto);

  return productos.filter((producto) => {
    const coincideTexto =
      termino === "" ||
      normalizar(producto.nombre).includes(termino) ||
      normalizar(producto.codigo).includes(termino);
    const coincideCategoria =
      filtro.categoria === CATEGORIA_TODAS || producto.categoria === filtro.categoria;
    const coincideMinimo = !filtro.soloBajoMinimo || esBajoMinimo(producto);

    return coincideTexto && coincideCategoria && coincideMinimo;
  });
}

/** Totales del surtido para el encabezado de la vista. */
export function resumenSurtido(productos: readonly Producto[]): ResumenSurtido {
  return {
    total: productos.length,
    unidades: productos.reduce((suma, producto) => suma + producto.cantidadDisponible, 0),
    bajoMinimo: calcularAlertasReposicion(productos).length,
    agotados: productos.filter((producto) => producto.cantidadDisponible <= 0).length,
  };
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(valor);
}
