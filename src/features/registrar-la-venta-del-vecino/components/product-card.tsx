import type { ReactNode } from "react";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { estaVencido } from "@/domain/productos";

import { formatearMoneda, type ProductoCatalogo } from "../logic";

export interface ProductCardProps {
  producto: ProductoCatalogo;
  action?: ReactNode;
}

/** Tarjeta visual de un producto del catálogo (icono, precio y estado). */
export function ProductCard({ producto, action }: ProductCardProps) {
  const vencido = estaVencido(producto);
  const agotado = producto.cantidadDisponible <= 0;
  const bajoStock = !agotado && producto.cantidadDisponible <= producto.nivelMinimo;

  return (
    <Card className="h-100">
      <CardBody className="d-flex flex-column gap-3">
        <div className="d-flex align-items-start gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded bg-primary-subtle text-primary flex-shrink-0"
            style={{ width: "2.75rem", height: "2.75rem" }}
          >
            <Package size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h6 className="fw-semibold text-dark mb-1 text-truncate">{producto.nombre}</h6>
            <div className="small text-muted text-truncate">
              Código {producto.codigo} · {producto.categoria}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-baseline gap-1">
          <span className="h5 fw-bold text-primary mb-0">{formatearMoneda(producto.precioVenta)}</span>
          <span className="small text-muted">/ {producto.unidadMedida}</span>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {vencido ? <Badge tone="danger">Vencido</Badge> : null}
          {agotado && !vencido ? <Badge tone="danger">Agotado</Badge> : null}
          {bajoStock ? <Badge tone="warning">Bajo stock</Badge> : null}
          {!vencido && !agotado && !bajoStock ? <Badge tone="success">Disponible</Badge> : null}
          <Badge tone="neutral">{producto.cantidadDisponible} disponibles</Badge>
        </div>

        {action ? <div className="mt-auto">{action}</div> : null}
      </CardBody>
    </Card>
  );
}
