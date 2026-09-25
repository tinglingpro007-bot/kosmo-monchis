import type { FeatureGroup, FeatureManifest } from "@/features/types";
import { manifest as registrarVentaManifest } from "@/features/registrar-la-venta-del-vecino/manifest";
import { manifest as saberQueQuedaManifest } from "@/features/saber-que-queda-en-la-tienda/manifest";

export const features: FeatureManifest[] = [
  registrarVentaManifest,
  saberQueQuedaManifest,
];

export const featureGroups: FeatureGroup[] = [
  {
    label: "Área Vendedor de mostrador",
    features: [registrarVentaManifest],
  },
  {
    label: "Área Dueño de la tienda",
    features: [saberQueQuedaManifest],
  },
];
