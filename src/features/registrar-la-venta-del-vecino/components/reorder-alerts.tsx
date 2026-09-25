import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

import type { ProductoCatalogo } from "../logic";

interface ReorderAlertsProps {
  alertas: ProductoCatalogo[];
}

/** Alertas de reposición: productos en o por debajo de su nivel mínimo. */
export function ReorderAlerts({ alertas }: ReorderAlertsProps) {
  return (
    <Card className="h-100">
      <CardHeader className="pt-3">
        <CardTitle className="d-flex align-items-center gap-2 mb-0">
          <AlertTriangle size={18} className="text-warning" />
          Alertas de reposición
        </CardTitle>
        <p className="text-muted small mb-0 mt-1">
          Productos que alcanzaron o bajaron de su nivel mínimo.
        </p>
      </CardHeader>
      <CardBody className="pt-3">
        {alertas.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Todo con existencias suficientes"
            description="No hay productos por debajo del nivel mínimo configurado."
          />
        ) : (
          <ul className="list-group list-group-flush">
            {alertas.map((producto) => (
              <li
                key={producto.id}
                className="list-group-item px-0 d-flex justify-content-between align-items-center gap-2"
              >
                <div>
                  <div className="fw-semibold text-dark">{producto.nombre}</div>
                  <div className="small text-muted">Código {producto.codigo}</div>
                </div>
                <Badge tone="warning">
                  {producto.cantidadDisponible} / mín. {producto.nivelMinimo}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
