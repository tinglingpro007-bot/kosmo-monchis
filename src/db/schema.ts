// Database schema definitions using Drizzle ORM (SQLite)
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Vendedores de mostrador de la tienda. Catálogo maestro que permite
 * registrar el responsable que atendió cada venta (no existe autenticación).
 */
export const vendedores = sqliteTable("vendedores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
});

/**
 * Catálogo de productos de primera necesidad. Entidad compartida por varias
 * características (ventas, inventario, catálogo).
 */
export const productos = sqliteTable("productos", {
  id: text("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  nombre: text("nombre").notNull(),
  categoria: text("categoria").notNull(),
  precioVenta: real("precio_venta").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
  nivelMinimo: integer("nivel_minimo").notNull().default(0),
  fechaCaducidad: integer("fecha_caducidad", { mode: "timestamp" }),
  cantidadDisponible: integer("cantidad_disponible").notNull().default(0),
});

/** Cabecera de una venta registrada por el vendedor de mostrador. */
export const ventas = sqliteTable("ventas", {
  id: text("id").primaryKey(),
  fecha: integer("fecha", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  vendedorId: text("vendedor_id")
    .notNull()
    .references(() => vendedores.id),
  vendedorNombre: text("vendedor_nombre").notNull(),
  total: real("total").notNull(),
});

/** Detalle de productos y cantidades de cada venta. */
export const ventaItems = sqliteTable("venta_items", {
  id: text("id").primaryKey(),
  ventaId: text("venta_id")
    .notNull()
    .references(() => ventas.id),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  codigo: text("codigo").notNull(),
  nombre: text("nombre").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: real("precio_unitario").notNull(),
  subtotal: real("subtotal").notNull(),
});

/**
 * Movimientos de existencias distintos de la venta (entradas y ajustes).
 * Registran fecha, tipo, cantidad y responsable (Regla 5 de negocio).
 */
export const movimientos = sqliteTable("movimientos", {
  id: text("id").primaryKey(),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  tipo: text("tipo").notNull(),
  cantidad: integer("cantidad").notNull(),
  motivo: text("motivo"),
  responsable: text("responsable").notNull(),
  fecha: integer("fecha", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Vendedor = typeof vendedores.$inferSelect;
export type NewVendedor = typeof vendedores.$inferInsert;
export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;
export type Venta = typeof ventas.$inferSelect;
export type NewVenta = typeof ventas.$inferInsert;
export type VentaItem = typeof ventaItems.$inferSelect;
export type NewVentaItem = typeof ventaItems.$inferInsert;
export type Movimiento = typeof movimientos.$inferSelect;
export type NewMovimiento = typeof movimientos.$inferInsert;
