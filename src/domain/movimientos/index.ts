import type { Producto } from "@/db/schema";

/** Tipos de movimiento de existencias ajenos a la venta. */
export const TIPOS_MOVIMIENTO = ["entrada", "ajuste_entrada", "ajuste_salida"] as const;

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const MENSAJE_CANTIDAD_NEGATIVA = "La cantidad disponible no puede ser negativa";

export function esTipoMovimiento(valor: unknown): valor is TipoMovimiento {
  return TIPOS_MOVIMIENTO.includes(valor as TipoMovimiento);
}

/** Una entrada o ajuste positivo suma existencias; un ajuste de salida las resta. */
export function signoMovimiento(tipo: TipoMovimiento): 1 | -1 {
  return tipo === "entrada" || tipo === "ajuste_entrada" ? 1 : -1;
}

/** Cantidad disponible resultante tras aplicar un movimiento. */
export function aplicarMovimiento(
  cantidadActual: number,
  tipo: TipoMovimiento,
  cantidad: number,
): number {
  return cantidadActual + signoMovimiento(tipo) * cantidad;
}

export type ResultadoMovimiento =
  | { ok: true; nuevaCantidad: number }
  | { ok: false; error: string };

/**
 * Calcula la cantidad disponible resultante y rechaza el movimiento si dejara
 * el saldo negativo, conservando la cantidad anterior (REQ-2.1 y REQ-2.6).
 */
export function validarMovimiento(
  producto: Pick<Producto, "cantidadDisponible">,
  tipo: TipoMovimiento,
  cantidad: number,
): ResultadoMovimiento {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { ok: false, error: "La cantidad del movimiento debe ser mayor a cero" };
  }

  const nuevaCantidad = aplicarMovimiento(producto.cantidadDisponible, tipo, cantidad);
  if (nuevaCantidad < 0) {
    return { ok: false, error: MENSAJE_CANTIDAD_NEGATIVA };
  }

  return { ok: true, nuevaCantidad };
}

export function etiquetaMovimiento(tipo: TipoMovimiento): string {
  switch (tipo) {
    case "entrada":
      return "Entrada";
    case "ajuste_entrada":
      return "Ajuste de entrada";
    case "ajuste_salida":
      return "Ajuste de salida";
  }
}
