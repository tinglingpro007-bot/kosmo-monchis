import { Receipt } from "lucide-react";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

import { formatearMoneda, type VentaDelDia } from "../logic";

interface SalesHistoryProps {
  ventas: VentaDelDia[];
  totalDia: number;
}

const HORA = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit" });

/** Historial de las ventas registradas en la jornada. */
export function SalesHistory({ ventas, totalDia }: SalesHistoryProps) {
  return (
    <Card className="h-100">
      <CardHeader className="pt-3">
        <CardTitle className="d-flex align-items-center gap-2 mb-0">
          <Receipt size={18} className="text-primary" />
          Ventas del día
        </CardTitle>
        <p className="text-muted small mb-0 mt-1">
          {ventas.length} {ventas.length === 1 ? "venta registrada" : "ventas registradas"} · Total{" "}
          {formatearMoneda(totalDia)}
        </p>
      </CardHeader>
      <CardBody className="pt-3">
        {ventas.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aún no hay ventas hoy"
            description="Las ventas que confirmes aparecerán aquí con su hora y monto."
          />
        ) : (
          <ul className="list-group list-group-flush">
            {ventas.map((venta) => (
              <li key={venta.id} className="list-group-item px-0">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-semibold text-dark">
                      {HORA.format(new Date(venta.fecha))} · {venta.vendedorNombre}
                    </div>
                    <div className="small text-muted">
                      {venta.items
                        .map((item) => `${item.cantidad} × ${item.nombre}`)
                        .join(", ")}
                    </div>
                  </div>
                  <span className="fw-bold text-primary">{formatearMoneda(venta.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
