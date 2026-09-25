import type { FeatureGroup, FeatureManifest } from "@/features/types";
import { manifest as registrarVentaManifest } from "@/features/registrar-la-venta-del-vecino/manifest";

export const features: FeatureManifest[] = [registrarVentaManifest];

export const featureGroups: FeatureGroup[] = [
  {
    label: "Área Vendedor de mostrador",
    features: [registrarVentaManifest],
  },
];
