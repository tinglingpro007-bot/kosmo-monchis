import { PackageSearch } from "lucide-react";

import type { FeatureManifest } from "@/features/types";

export const manifest: FeatureManifest = {
  slug: "saber-que-queda-en-la-tienda",
  title: "Saber qué queda en la tienda",
  description:
    "Revisa el surtido completo, las unidades disponibles, los productos bajo el mínimo y registra entradas o ajustes.",
  route: "/saber-que-queda-en-la-tienda",
  icon: PackageSearch,
  group: "Área Dueño de la tienda",
  actor: "Dueño de la tienda",
};
