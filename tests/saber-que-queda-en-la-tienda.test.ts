import { describe, expect, it } from "vitest";

import type { Producto } from "@/db/schema";
import {
  MENSAJE_CANTIDAD_NEGATIVA,
  aplicarMovimiento,
  esTipoMovimiento,
  validarMovimiento,
} from "@/domain/movimientos";
import {
  CATEGORIA_TODAS,
  esBajoMinimo,
  filtrarSurtido,
  listarCategoriasSurtido,
  resumenSurtido,
} from "@/features/saber-que-queda-en-la-tienda/logic";

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: "p-arroz",
    codigo: "ARR-001",
    nombre: "Arroz 1 kg",
    categoria: "Abarrotes",
    precioVenta: 1.15,
    unidadMedida: "unidad",
    nivelMinimo: 8,
    fechaCaducidad: null,
    cantidadDisponible: 20,
    ...overrides,
  };
}

const FILTRO_VACIO = { texto: "", categoria: CATEGORIA_TODAS, soloBajoMinimo: false };

describe("REQ-2.3 listado completo del surtido", () => {
  it("devuelve todos los productos sin filtros", () => {
    const surtido = [producto(), producto({ id: "p-pan", nombre: "Pan de molde" })];

    expect(filtrarSurtido(surtido, FILTRO_VACIO)).toHaveLength(2);
  });

  it("devuelve una lista vacía cuando no hay productos", () => {
    expect(filtrarSurtido([], FILTRO_VACIO)).toEqual([]);
    expect(resumenSurtido([])).toEqual({ total: 0, unidades: 0, bajoMinimo: 0, agotados: 0 });
  });

  it("busca por nombre y por código sin distinguir tildes", () => {
    const surtido = [
      producto({ id: "p-azucar", nombre: "Azúcar 1 kg", codigo: "AZU-001" }),
      producto({ id: "p-pan", nombre: "Pan de molde", codigo: "PAN-001" }),
    ];

    expect(filtrarSurtido(surtido, { ...FILTRO_VACIO, texto: "azucar" })).toHaveLength(1);
    expect(filtrarSurtido(surtido, { ...FILTRO_VACIO, texto: "PAN-001" })[0]?.nombre).toBe(
      "Pan de molde",
    );
  });

  it("filtra por categoría", () => {
    const surtido = [
      producto({ id: "p-1", categoria: "Abarrotes" }),
      producto({ id: "p-2", categoria: "Lácteos", nombre: "Leche entera" }),
    ];

    expect(filtrarSurtido(surtido, { ...FILTRO_VACIO, categoria: "Lácteos" })).toHaveLength(1);
    expect(listarCategoriasSurtido(surtido)).toEqual(["Abarrotes", "Lácteos"]);
  });
});

describe("REQ-2.4 señalización bajo el mínimo", () => {
  it("señala cuando la cantidad iguala el mínimo", () => {
    expect(esBajoMinimo(producto({ cantidadDisponible: 5, nivelMinimo: 5 }))).toBe(true);
  });

  it("señala cuando la cantidad está por debajo del mínimo", () => {
    expect(esBajoMinimo(producto({ cantidadDisponible: 3, nivelMinimo: 5 }))).toBe(true);
  });

  it("no señala cuando la cantidad supera el mínimo", () => {
    expect(esBajoMinimo(producto({ cantidadDisponible: 30, nivelMinimo: 10 }))).toBe(false);
  });
});

describe("REQ-2.5 filtro 'Solo productos bajo el mínimo'", () => {
  const surtido = [
    producto({ id: "p-1", cantidadDisponible: 5, nivelMinimo: 5 }),
    producto({ id: "p-2", cantidadDisponible: 1, nivelMinimo: 4 }),
    producto({ id: "p-3", cantidadDisponible: 30, nivelMinimo: 10 }),
  ];

  it("muestra únicamente los productos en o bajo el mínimo", () => {
    const filtrados = filtrarSurtido(surtido, { ...FILTRO_VACIO, soloBajoMinimo: true });

    expect(filtrados.map((p) => p.id)).toEqual(["p-1", "p-2"]);
  });

  it("vuelve a mostrar el surtido completo al desactivar el filtro", () => {
    expect(filtrarSurtido(surtido, FILTRO_VACIO)).toHaveLength(3);
  });
});

describe("REQ-2.2 resumen de existencias", () => {
  it("cuenta total, unidades, bajo mínimo y agotados", () => {
    const surtido = [
      producto({ id: "p-1", cantidadDisponible: 20, nivelMinimo: 8 }),
      producto({ id: "p-2", cantidadDisponible: 5, nivelMinimo: 5 }),
      producto({ id: "p-3", cantidadDisponible: 0, nivelMinimo: 3 }),
    ];

    expect(resumenSurtido(surtido)).toEqual({
      total: 3,
      unidades: 25,
      bajoMinimo: 2,
      agotados: 1,
    });
  });
});

describe("REQ-2.1 cantidad disponible calculada por movimientos", () => {
  it("calcula la salida tras una venta de 3 unidades", () => {
    expect(aplicarMovimiento(20, "ajuste_salida", 3)).toBe(17);
  });

  it("calcula la entrada de 24 unidades", () => {
    const resultado = validarMovimiento(producto({ cantidadDisponible: 5 }), "entrada", 24);

    expect(resultado).toEqual({ ok: true, nuevaCantidad: 29 });
  });

  it("rechaza cantidades no enteras o menores a uno", () => {
    const p = producto();
    expect(validarMovimiento(p, "entrada", 0).ok).toBe(false);
    expect(validarMovimiento(p, "entrada", -2).ok).toBe(false);
    expect(validarMovimiento(p, "entrada", 1.5).ok).toBe(false);
  });
});

describe("REQ-2.6 rechazo de cantidad disponible negativa", () => {
  it("impide un ajuste de salida mayor a la existencia", () => {
    const galletas = producto({
      id: "p-galletas",
      nombre: "Galletas paquete",
      cantidadDisponible: 3,
    });

    expect(validarMovimiento(galletas, "ajuste_salida", 4)).toEqual({
      ok: false,
      error: MENSAJE_CANTIDAD_NEGATIVA,
    });
  });

  it("conserva la cantidad anterior al rechazar", () => {
    const yogur = producto({ id: "p-yogur", cantidadDisponible: 2 });
    const resultado = validarMovimiento(yogur, "ajuste_salida", 5);

    expect(resultado.ok).toBe(false);
    expect(yogur.cantidadDisponible).toBe(2);
  });

  it("permite un ajuste de salida exacto", () => {
    const p = producto({ cantidadDisponible: 3 });

    expect(validarMovimiento(p, "ajuste_salida", 3)).toEqual({ ok: true, nuevaCantidad: 0 });
  });
});

describe("tipos de movimiento", () => {
  it("reconoce solo los tipos válidos", () => {
    expect(esTipoMovimiento("entrada")).toBe(true);
    expect(esTipoMovimiento("ajuste_salida")).toBe(true);
    expect(esTipoMovimiento("venta")).toBe(false);
    expect(esTipoMovimiento(undefined)).toBe(false);
  });
});
