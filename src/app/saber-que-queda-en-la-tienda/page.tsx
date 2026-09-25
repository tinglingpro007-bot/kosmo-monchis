import { asc } from "drizzle-orm";

import { db } from "@/db";
import { productos } from "@/db/schema";
import { ensureSeedData } from "@/db/seed";
import { SurtidoWorkspace } from "@/features/saber-que-queda-en-la-tienda/components/surtido-workspace";

export const dynamic = "force-dynamic";

export default async function SaberQueQuedaEnLaTiendaPage() {
  await ensureSeedData();

  const catalogo = await db.select().from(productos).orderBy(asc(productos.nombre));

  return <SurtidoWorkspace productos={catalogo} />;
}
