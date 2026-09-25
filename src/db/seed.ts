import { db } from "@/db";
import { productos, vendedores, type NewProducto } from "@/db/schema";

function diasDesdeHoy(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

const VENDEDORES_INICIALES = [
  { id: "ven-maria", nombre: "María Torres" },
  { id: "ven-luis", nombre: "Luis Quishpe" },
  { id: "ven-ana", nombre: "Ana Guamán" },
];

const PRODUCTOS_INICIALES: NewProducto[] = [
  { id: "prd-arroz", codigo: "ARR-001", nombre: "Arroz 1 kg", categoria: "Abarrotes", precioVenta: 1.15, unidadMedida: "unidad", nivelMinimo: 8, cantidadDisponible: 15 },
  { id: "prd-azucar", codigo: "AZU-001", nombre: "Azúcar 1 kg", categoria: "Abarrotes", precioVenta: 1.25, unidadMedida: "unidad", nivelMinimo: 6, cantidadDisponible: 20 },
  { id: "prd-aceite", codigo: "ACE-001", nombre: "Aceite 1 L", categoria: "Abarrotes", precioVenta: 2.75, unidadMedida: "botella", nivelMinimo: 4, fechaCaducidad: diasDesdeHoy(180), cantidadDisponible: 8 },
  { id: "prd-leche", codigo: "LEC-001", nombre: "Leche entera", categoria: "Lácteos", precioVenta: 1.1, unidadMedida: "funda", nivelMinimo: 5, fechaCaducidad: diasDesdeHoy(5), cantidadDisponible: 6 },
  { id: "prd-pan", codigo: "PAN-001", nombre: "Pan de molde", categoria: "Panadería", precioVenta: 1.3, unidadMedida: "unidad", nivelMinimo: 3, fechaCaducidad: diasDesdeHoy(3), cantidadDisponible: 12 },
  { id: "prd-yogur", codigo: "YOG-001", nombre: "Yogur 200 ml", categoria: "Lácteos", precioVenta: 0.85, unidadMedida: "unidad", nivelMinimo: 4, fechaCaducidad: diasDesdeHoy(8), cantidadDisponible: 4 },
  { id: "prd-queso", codigo: "QUE-001", nombre: "Queso fresco 500 g", categoria: "Lácteos", precioVenta: 3.2, unidadMedida: "unidad", nivelMinimo: 2, fechaCaducidad: diasDesdeHoy(-10), cantidadDisponible: 5 },
  { id: "prd-huevos", codigo: "HUE-001", nombre: "Huevos docena", categoria: "Abarrotes", precioVenta: 2.4, unidadMedida: "docena", nivelMinimo: 5, fechaCaducidad: diasDesdeHoy(12), cantidadDisponible: 14 },
  { id: "prd-fideos", codigo: "FID-001", nombre: "Fideos 250 g", categoria: "Abarrotes", precioVenta: 0.75, unidadMedida: "funda", nivelMinimo: 10, fechaCaducidad: diasDesdeHoy(200), cantidadDisponible: 25 },
  { id: "prd-sal", codigo: "SAL-001", nombre: "Sal 1 kg", categoria: "Abarrotes", precioVenta: 0.65, unidadMedida: "unidad", nivelMinimo: 5, cantidadDisponible: 9 },
  { id: "prd-cafe", codigo: "CAF-001", nombre: "Café molido 250 g", categoria: "Bebidas", precioVenta: 2.9, unidadMedida: "funda", nivelMinimo: 3, fechaCaducidad: diasDesdeHoy(120), cantidadDisponible: 7 },
  { id: "prd-gaseosa", codigo: "GAS-001", nombre: "Gaseosa 2 L", categoria: "Bebidas", precioVenta: 1.8, unidadMedida: "botella", nivelMinimo: 6, fechaCaducidad: diasDesdeHoy(90), cantidadDisponible: 10 },
  { id: "prd-jabon", codigo: "JAB-001", nombre: "Jabón de baño", categoria: "Aseo", precioVenta: 1.05, unidadMedida: "unidad", nivelMinimo: 5, cantidadDisponible: 12 },
  { id: "prd-detergente", codigo: "DET-001", nombre: "Detergente 500 g", categoria: "Limpieza", precioVenta: 2.1, unidadMedida: "funda", nivelMinimo: 4, cantidadDisponible: 6 },
];

/**
 * Siembra idempotente del catálogo maestro. Se ejecuta al abrir la vista para
 * que la tienda opere con datos reales desde el primer despliegue.
 */
export async function ensureSeedData(): Promise<void> {
  const productosExistentes = await db.select({ id: productos.id }).from(productos).limit(1);
  if (productosExistentes.length === 0) {
    await db.insert(productos).values(PRODUCTOS_INICIALES);
  }

  const vendedoresExistentes = await db.select({ id: vendedores.id }).from(vendedores).limit(1);
  if (vendedoresExistentes.length === 0) {
    await db.insert(vendedores).values(VENDEDORES_INICIALES);
  }
}
