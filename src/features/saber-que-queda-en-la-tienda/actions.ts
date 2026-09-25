"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { movimientos, productos } from "@/db/schema";
import {
  validarMovimiento,
  esTipoMovimiento,
  type TipoMovimiento,
} from "@/domain/movimientos";

const RUTA = "/saber-que-queda-en-la-tienda";

export interface RegistrarMovimientoInput {
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  responsable?: string;
}

export type RegistrarMovimientoResult =
  | { success: true; nuevaCantidad: number; mensaje: string }
  | { success: false; error: string };

/**
 * Registra una entrada o ajuste de existencias: valida contra la base de datos,
 * rechaza saldos negativos (REQ-2.6) y en una sola transacción guarda el
 * movimiento y actualiza la cantidad disponible (REQ-2.1 y REQ-2.7).
 */
export async function registrarMovimientoAction(
  input: RegistrarMovimientoInput,
): Promise<RegistrarMovimientoResult> {
  try {
    if (!input.productoId) {
      return { success: false, error: "Seleccione un producto del surtido" };
    }
    if (!esTipoMovimiento(input.tipo)) {
      return { success: false, error: "El tipo de movimiento no es válido" };
    }

    const [producto] = await db
      .select()
      .from(productos)
      .where(eq(productos.id, input.productoId));
    if (!producto) {
      return { success: false, error: "El producto no existe en el catálogo" };
    }

    const validacion = validarMovimiento(producto, input.tipo, input.cantidad);
    if (!validacion.ok) {
      return { success: false, error: validacion.error };
    }

    const responsable = input.responsable?.trim() || "Dueño de la tienda";
    const motivo = input.motivo?.trim() || null;

    db.transaction((tx) => {
      tx.insert(movimientos)
        .values({
          id: randomUUID(),
          productoId: producto.id,
          tipo: input.tipo,
          cantidad: input.cantidad,
          motivo,
          responsable,
          fecha: new Date(),
        })
        .run();

      tx.update(productos)
        .set({ cantidadDisponible: validacion.nuevaCantidad })
        .where(eq(productos.id, producto.id))
        .run();
    });

    revalidatePath(RUTA);
    return {
      success: true,
      nuevaCantidad: validacion.nuevaCantidad,
      mensaje: "Movimiento registrado correctamente",
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
