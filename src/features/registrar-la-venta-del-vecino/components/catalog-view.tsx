"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

import { buscarProductos, listarCategorias, type ProductoCatalogo } from "../logic";
import { ProductCard } from "./product-card";

interface CatalogViewProps {
  productos: ProductoCatalogo[];
}

/** Vitrina del vecino comprador: precios y disponibilidad sin acciones de venta. */
export function CatalogView({ productos }: CatalogViewProps) {
  const [termino, setTermino] = useState("");
  const [categoria, setCategoria] = useState("todas");

  const categorias = listarCategorias(productos);
  const filtrados = buscarProductos(productos, termino).filter(
    (producto) => categoria === "todas" || producto.categoria === categoria,
  );

  return (
    <div className="d-flex flex-column gap-4">
      <Card>
        <CardBody className="row g-2 align-items-end">
          <div className="col-12 col-md-7">
            <Label htmlFor="buscar-vitrina">¿Qué está buscando, vecino?</Label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} />
              </span>
              <Input
                id="buscar-vitrina"
                placeholder="Escriba el nombre del producto"
                value={termino}
                onChange={(evento) => setTermino(evento.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-5">
            <Label htmlFor="categoria-vitrina">Categoría</Label>
            <Select
              id="categoria-vitrina"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No encontramos ese producto"
          description="Prueba con otro nombre o revisa las categorías disponibles."
        />
      ) : (
        <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3">
          {filtrados.map((producto) => (
            <div key={producto.id} className="col">
              <ProductCard producto={producto} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
