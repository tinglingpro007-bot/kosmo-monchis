import type { Producto } from "@/db/schema";

export type { Producto, NewProducto } from "@/db/schema";

function inicioDelDia(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

/**
 * Un producto está vencido cuando su fecha de caducidad es anterior al día
 * actual. Sin fecha de caducidad se considera vigente.
 */
export function estaVencido(
  producto: Pick<Producto, "fechaCaducidad">,
  hoy: Date = new Date(),
): boolean {
  if (!producto.fechaCaducidad) return false;
  return inicioDelDia(new Date(producto.fechaCaducidad)).getTime() < inicioDelDia(hoy).getTime();
}

/** Un producto puede ofrecerse en venta únicamente si no está vencido. */
export function puedeVenderse(
  producto: Pick<Producto, "fechaCaducidad">,
  hoy: Date = new Date(),
): boolean {
  return !estaVencido(producto, hoy);
}

/**
 * Alerta de reposición: todo producto cuya cantidad disponible alcanzó o
 * descendió por debajo de su nivel mínimo de existencias.
 */
export function calcularAlertasReposicion<
  T extends { cantidadDisponible: number; nivelMinimo: number },
>(productos: readonly T[]): T[] {
  return productos.filter((producto) => producto.cantidadDisponible <= producto.nivelMinimo);
}
