import { asc, desc, gte, inArray } from "drizzle-orm";

import { db } from "@/db";
import { productos, vendedores, ventaItems, ventas, type VentaItem } from "@/db/schema";
import { ensureSeedData } from "@/db/seed";
import { calcularAlertasReposicion } from "@/domain/productos";
import { VentasWorkspace } from "@/features/registrar-la-venta-del-vecino/components/ventas-workspace";
import { redondear2, type VentaDelDia } from "@/features/registrar-la-venta-del-vecino/logic";

export const dynamic = "force-dynamic";

export default async function RegistrarVentaPage() {
  await ensureSeedData();

  const [catalogo, listaVendedores] = await Promise.all([
    db.select().from(productos).orderBy(asc(productos.nombre)),
    db.select().from(vendedores).orderBy(asc(vendedores.nombre)),
  ]);

  const inicioDelDia = new Date();
  inicioDelDia.setHours(0, 0, 0, 0);

  const ventasHoy = await db
    .select()
    .from(ventas)
    .where(gte(ventas.fecha, inicioDelDia))
    .orderBy(desc(ventas.fecha));

  const idsVentas = ventasHoy.map((venta) => venta.id);
  const itemsHoy: VentaItem[] =
    idsVentas.length > 0
      ? await db.select().from(ventaItems).where(inArray(ventaItems.ventaId, idsVentas))
      : [];

  const ventasDelDia: VentaDelDia[] = ventasHoy.map((venta) => ({
    id: venta.id,
    fecha: venta.fecha,
    vendedorNombre: venta.vendedorNombre,
    total: venta.total,
    items: itemsHoy
      .filter((item) => item.ventaId === venta.id)
      .map((item) => ({
        codigo: item.codigo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
      })),
  }));

  const alertas = calcularAlertasReposicion(catalogo);
  const totalDia = redondear2(ventasHoy.reduce((suma, venta) => suma + venta.total, 0));

  return (
    <VentasWorkspace
      productos={catalogo}
      vendedores={listaVendedores}
      ventas={ventasDelDia}
      alertas={alertas}
      totalDia={totalDia}
    />
  );
}
