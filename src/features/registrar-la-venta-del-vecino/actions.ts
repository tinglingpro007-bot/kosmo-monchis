"use server";

import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  productos,
  ventas,
  ventaItems,
  type NewVentaItem,
  type Producto,
} from "@/db/schema";
import { estaVencido } from "@/domain/productos";

import { MENSAJES, redondear2, type LineaVenta } from "./logic";

const RUTA = "/registrar-la-venta-del-vecino";

export interface RegistrarVentaInput {
  vendedorId: string;
  vendedorNombre: string;
  lineas: LineaVenta[];
}

export type RegistrarVentaResult =
  | { success: true; ventaId: string; total: number }
  | { success: false; error: string };

/**
 * Registra una venta real: valida contra la base de datos (nunca confía en el
 * cliente), almacena la cabecera y el detalle, y descuenta las existencias en
 * una sola transacción.
 */
export async function registrarVentaAction(
  input: RegistrarVentaInput,
): Promise<RegistrarVentaResult> {
  try {
    if (!input.vendedorId || !input.vendedorNombre) {
      return { success: false, error: "Seleccione el vendedor que atiende la venta" };
    }
    if (!input.lineas || input.lineas.length === 0) {
      return { success: false, error: MENSAJES.carritoVacio };
    }

    const ids = [...new Set(input.lineas.map((linea) => linea.productoId))];
    const encontrados = await db.select().from(productos).where(inArray(productos.id, ids));
    const porId = new Map<string, Producto>(encontrados.map((producto) => [producto.id, producto]));

    const ventaId = randomUUID();
    const hoy = new Date();
    const preparados: Array<{ item: NewVentaItem; producto: Producto }> = [];

    for (const linea of input.lineas) {
      const producto = porId.get(linea.productoId);
      if (!producto) return { success: false, error: MENSAJES.noExiste };
      if (estaVencido(producto, hoy)) return { success: false, error: MENSAJES.vencido };
      const cantidad = linea.cantidad;
      if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > producto.cantidadDisponible) {
        return { success: false, error: `Las existencias de ${producto.nombre} no son suficientes` };
      }

      preparados.push({
        producto,
        item: {
          id: randomUUID(),
          ventaId,
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          cantidad,
          precioUnitario: producto.precioVenta,
          subtotal: redondear2(cantidad * producto.precioVenta),
        },
      });
    }

    const total = redondear2(preparados.reduce((suma, { item }) => suma + item.subtotal, 0));

    db.transaction((tx) => {
      tx.insert(ventas)
        .values({
          id: ventaId,
          fecha: new Date(),
          vendedorId: input.vendedorId,
          vendedorNombre: input.vendedorNombre,
          total,
        })
        .run();

      for (const { item, producto } of preparados) {
        tx.insert(ventaItems).values(item).run();
        tx.update(productos)
          .set({ cantidadDisponible: producto.cantidadDisponible - item.cantidad })
          .where(eq(productos.id, producto.id))
          .run();
      }
    });

    revalidatePath(RUTA);
    return { success: true, ventaId, total };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
