"use client";

import { useState } from "react";
import { ShoppingCart, Store } from "lucide-react";

import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Tabs, type TabItem } from "@/components/ui/tabs";

import type { ProductoCatalogo, VentaDelDia } from "../logic";
import { CatalogView } from "./catalog-view";
import { ReorderAlerts } from "./reorder-alerts";
import { SaleRegister } from "./sale-register";
import { SalesHistory } from "./sales-history";

interface VendedorOpcion {
  id: string;
  nombre: string;
}

interface VentasWorkspaceProps {
  productos: ProductoCatalogo[];
  vendedores: VendedorOpcion[];
  ventas: VentaDelDia[];
  alertas: ProductoCatalogo[];
  totalDia: number;
}

export function VentasWorkspace({
  productos,
  vendedores,
  ventas,
  alertas,
  totalDia,
}: VentasWorkspaceProps) {
  const [rol, setRol] = useState("vendedor");
  const [vendedorId, setVendedorId] = useState(vendedores[0]?.id ?? "");
  const vendedorNombre = vendedores.find((vendedor) => vendedor.id === vendedorId)?.nombre ?? "";

  const tabs: TabItem[] = [
    { id: "vendedor", label: "Vendedor de mostrador", icon: <Store size={16} /> },
    { id: "comprador", label: "Vecino comprador", icon: <ShoppingCart size={16} /> },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        title="Registrar la venta del vecino"
        description="Anota los productos que lleva el vecino, valida las existencias y confirma la venta del día."
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <Tabs items={tabs} activeId={rol} onChange={setRol} variant="pills" />
        {rol === "vendedor" ? (
          <div className="d-flex align-items-center gap-2">
            <Label htmlFor="vendedor-select" className="mb-0 text-nowrap">
              Atendido por
            </Label>
            <Select
              id="vendedor-select"
              value={vendedorId}
              onChange={(evento) => setVendedorId(evento.target.value)}
              style={{ minWidth: "12rem" }}
            >
              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {rol === "vendedor" ? (
        <>
          <SaleRegister
            productos={productos}
            vendedorId={vendedorId}
            vendedorNombre={vendedorNombre}
          />
          <div className="row g-3">
            <div className="col-lg-7">
              <SalesHistory ventas={ventas} totalDia={totalDia} />
            </div>
            <div className="col-lg-5">
              <ReorderAlerts alertas={alertas} />
            </div>
          </div>
        </>
      ) : (
        <CatalogView productos={productos} />
      )}
    </div>
  );
}
