"use client";

import { useState, useTransition, type FormEvent } from "react";

import type { Producto } from "@/db/schema";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  TIPOS_MOVIMIENTO,
  etiquetaMovimiento,
  type TipoMovimiento,
} from "@/domain/movimientos";

import { registrarMovimientoAction } from "../actions";
import { esBajoMinimo, formatearMoneda } from "../logic";

interface ExistenciaDetalleModalProps {
  producto: Producto | null;
  puedeRegistrar: boolean;
  onClose: () => void;
}

/** Detalle del producto (REQ-2.2) y registro de entrada/ajuste (REQ-2.6). */
export function ExistenciaDetalleModal({
  producto,
  puedeRegistrar,
  onClose,
}: ExistenciaDetalleModalProps) {
  if (!producto) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={producto.nombre}
      size="lg"
      footer={
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="d-flex flex-column gap-4">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="small text-muted">Cantidad disponible</div>
            <div className="h4 fw-bold text-primary mb-0">
              {producto.cantidadDisponible}
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Unidad de medida</div>
            <div className="fw-semibold text-dark">{producto.unidadMedida}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Precio de venta</div>
            <div className="fw-semibold text-dark">{formatearMoneda(producto.precioVenta)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Nivel mínimo</div>
            <div className="fw-semibold text-dark">{producto.nivelMinimo}</div>
          </div>
        </div>

        {esBajoMinimo(producto) ? (
          <Badge tone="warning">Este producto está en o bajo el nivel mínimo</Badge>
        ) : null}

        {puedeRegistrar ? (
          <MovimientoForm producto={producto} />
        ) : (
          <Alert variant="info">
            La consulta del surtido está disponible para el vendedor. Las entradas y ajustes
            los registra el dueño de la tienda.
          </Alert>
        )}
      </div>
    </Modal>
  );
}

function MovimientoForm({ producto }: { producto: Producto }) {
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setExito(null);

    startTransition(async () => {
      const resultado = await registrarMovimientoAction({
        productoId: producto.id,
        tipo,
        cantidad,
        motivo,
        responsable: "Dueño de la tienda",
      });

      if (!resultado.success) {
        setError(resultado.error);
        return;
      }
      setExito(
        `Movimiento registrado. Ahora quedan ${resultado.nuevaCantidad} ${producto.unidadMedida} de ${producto.nombre}.`,
      );
      setMotivo("");
    });
  }

  return (
    <form className="border rounded p-3 bg-light" onSubmit={handleSubmit}>
      <h6 className="fw-semibold text-dark mb-3">Registrar movimiento</h6>

      {error ? (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      ) : null}
      {exito ? (
        <Alert variant="success" className="mb-3">
          {exito}
        </Alert>
      ) : null}

      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4">
          <Label htmlFor="mov-tipo">Tipo</Label>
          <Select
            id="mov-tipo"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value as TipoMovimiento)}
          >
            {TIPOS_MOVIMIENTO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {etiquetaMovimiento(opcion)}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-6 col-md-3">
          <Label htmlFor="mov-cantidad">Cantidad</Label>
          <Input
            id="mov-cantidad"
            type="number"
            min={1}
            step={1}
            value={cantidad}
            onChange={(evento) => setCantidad(Number(evento.target.value))}
          />
        </div>
        <div className="col-6 col-md-5">
          <Label htmlFor="mov-motivo">Motivo (opcional)</Label>
          <Input
            id="mov-motivo"
            placeholder="Compra a proveedor, corrección de conteo…"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Registrando…" : "Registrar movimiento"}
        </Button>
      </div>
    </form>
  );
}
