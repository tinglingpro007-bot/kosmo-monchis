import { Package } from "lucide-react";

import type { Producto } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { estaVencido } from "@/domain/productos";

import { esBajoMinimo, formatearMoneda } from "../logic";

interface ExistenciaCardProps {
  producto: Producto;
  onSelect: (producto: Producto) => void;
}

/** Tarjeta visual de un producto del surtido con su cantidad disponible. */
export function ExistenciaCard({ producto, onSelect }: ExistenciaCardProps) {
  const agotado = producto.cantidadDisponible <= 0;
  const bajoMinimo = esBajoMinimo(producto);
  const vencido = estaVencido(producto);

  return (
    <Card
      className={bajoMinimo ? "h-100 border border-warning border-2" : "h-100 border-0 shadow-sm"}
    >
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
              {producto.codigo} · {producto.categoria}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-baseline gap-2">
          <span className="display-6 fw-bold text-primary lh-1">
            {producto.cantidadDisponible}
          </span>
          <span className="small text-muted">{producto.unidadMedida} disponibles</span>
        </div>

        <div className="small text-muted">
          Precio {formatearMoneda(producto.precioVenta)} · Mínimo {producto.nivelMinimo}
        </div>

        <div className="d-flex flex-wrap gap-2">
          {vencido ? <Badge tone="danger">Vencido</Badge> : null}
          {agotado ? <Badge tone="danger">Agotado</Badge> : null}
          {bajoMinimo ? <Badge tone="warning">Bajo el mínimo</Badge> : null}
          {!vencido && !agotado && !bajoMinimo ? (
            <Badge tone="success">Disponible</Badge>
          ) : null}
        </div>

        <Button
          variant={bajoMinimo ? "primary" : "outline"}
          size="sm"
          className="w-100 mt-auto"
          onClick={() => onSelect(producto)}
        >
          Ver detalle
        </Button>
      </CardBody>
    </Card>
  );
}
