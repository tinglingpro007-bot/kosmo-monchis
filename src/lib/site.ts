export const siteConfig = {
  name: "Monchis",
  description: "Somos una tienda de barrio, vendemos productos de primera necesidad a los vecinos en Quito Ecuador",
  archetype: "storefront" as
    | "storefront"
    | "dashboard"
    | "workflow"
    | "saas_tool"
    | "content",
  primaryColor: "#00824d",
} as const;
