import { ShoppingCart } from "lucide-react";

import type { FeatureManifest } from "@/features/types";

export const manifest: FeatureManifest = {
  slug: "registrar-la-venta-del-vecino",
  title: "Registrar venta",
  description:
    "Anota los productos que lleva el vecino, valida existencias y confirma la venta del día.",
  route: "/registrar-la-venta-del-vecino",
  icon: ShoppingCart,
  group: "Área Vendedor de mostrador",
  actor: "Vendedor de mostrador",
};
