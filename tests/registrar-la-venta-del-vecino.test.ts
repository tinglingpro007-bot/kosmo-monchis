import { describe, expect, it } from "vitest";

import {
  calcularAlertasReposicion,
  estaVencido,
  puedeVenderse,
} from "@/domain/productos";
import {
  MENSAJES,
  agregarLinea,
  buscarProductos,
  calcularTotal,
  quitarLinea,
  validarVenta,
  type LineaVenta,
  type ProductoCatalogo,
} from "@/features/registrar-la-venta-del-vecino/logic";

function producto(overrides: Partial<ProductoCatalogo> = {}): ProductoCatalogo {
  return {
    id: "p-arroz",
    codigo: "ARR-001",
    nombre: "Arroz 1 kg",
    categoria: "Abarrotes",
    precioVenta: 1.15,
    unidadMedida: "unidad",
    nivelMinimo: 5,
    fechaCaducidad: null,
    cantidadDisponible: 15,
    ...overrides,
  };
}

function agregar(
  carrito: LineaVenta[],
  item: ProductoCatalogo | undefined,
  cantidad: number,
  hoy = new Date(2025, 0, 15),
): LineaVenta[] {
  const resultado = agregarLinea(carrito, item, cantidad, hoy);
  if (!resultado.ok) throw new Error(`No se esperaba error: ${resultado.error}`);
  return resultado.carrito;
}

const LECHE = producto({ id: "p-leche", codigo: "LEC-001", nombre: "Leche entera", precioVenta: 1.1 });
const PAN = producto({ id: "p-pan", codigo: "PAN-001", nombre: "Pan de molde", precioVenta: 1.3 });

describe("REQ-1.1 asociación al catálogo", () => {
  it("encuentra un producto por nombre y por código", () => {
    const catalogo = [producto(), PAN];

    expect(buscarProductos(catalogo, "arroz")).toHaveLength(1);
    expect(buscarProductos(catalogo, "PAN-001")[0]?.nombre).toBe("Pan de molde");
  });

  it("no agrega ni encuentra un producto inexistente", () => {
    const catalogo = [producto()];

    expect(buscarProductos(catalogo, "Pan integral")).toHaveLength(0);
    const resultado = agregarLinea([], undefined, 1);
    expect(resultado).toEqual({ ok: false, error: MENSAJES.noExiste });
  });

  it("agrega la línea con nombre, código y precio vigente", () => {
    const carrito = agregar([], producto(), 2);

    expect(carrito).toHaveLength(1);
    expect(carrito[0]).toMatchObject({
      codigo: "ARR-001",
      nombre: "Arroz 1 kg",
      precioUnitario: 1.15,
      cantidad: 2,
      subtotal: 2.3,
    });
  });
});

describe("REQ-1.5 cantidad no válida", () => {
  it("rechaza cantidad mayor que las existencias", () => {
    const yogur = producto({ id: "p-yogur", nombre: "Yogur 200 ml", cantidadDisponible: 4 });

    expect(agregarLinea([], yogur, 6)).toEqual({ ok: false, error: MENSAJES.cantidadInvalida });
  });

  it("rechaza cantidad cero o negativa", () => {
    expect(agregarLinea([], PAN, 0)).toEqual({ ok: false, error: MENSAJES.cantidadInvalida });
    expect(agregarLinea([], PAN, -2)).toEqual({ ok: false, error: MENSAJES.cantidadInvalida });
  });
});

describe("REQ-1.6 producto vencido", () => {
  it("impide agregar un producto vencido", () => {
    const vencido = producto({ fechaCaducidad: new Date(2025, 0, 10) });
    const hoy = new Date(2025, 0, 15);

    expect(agregarLinea([], vencido, 1, hoy)).toEqual({ ok: false, error: MENSAJES.vencido });
  });

  it("permite agregar un producto vigente", () => {
    const vigente = producto({ fechaCaducidad: new Date(2025, 0, 30) });
    const hoy = new Date(2025, 0, 15);
    const resultado = agregarLinea([], vigente, 1, hoy);

    expect(resultado.ok).toBe(true);
  });
});

describe("REQ-1.7 cálculo del total", () => {
  it("calcula 2.20 con un solo producto", () => {
    const carrito = agregar([], LECHE, 2);

    expect(calcularTotal(carrito)).toBe(2.2);
  });

  it("calcula 3.50 con varios productos", () => {
    const carrito = agregar(agregar([], LECHE, 2), PAN, 1);

    expect(calcularTotal(carrito)).toBe(3.5);
  });
});

describe("REQ-1.8 eliminación de líneas", () => {
  it("recalcula el total al quitar una línea", () => {
    let carrito = agregar(agregar([], LECHE, 2), PAN, 1);
    carrito = quitarLinea(carrito, PAN.id);

    expect(carrito).toHaveLength(1);
    expect(calcularTotal(carrito)).toBe(2.2);
  });

  it("deja el total en 0.00 sin líneas", () => {
    const carrito = quitarLinea(agregar([], PAN, 1), PAN.id);

    expect(carrito).toHaveLength(0);
    expect(calcularTotal(carrito)).toBe(0);
  });
});

describe("REQ-1.4 y REQ-1.9 confirmación", () => {
  it("rechaza confirmar sin productos", () => {
    expect(validarVenta([], [producto()])).toEqual({ ok: false, error: MENSAJES.carritoVacio });
  });

  it("rechaza existencias insuficientes al confirmar", () => {
    const arroz = producto({ cantidadDisponible: 2 });
    const carrito = agregar([], producto({ cantidadDisponible: 5 }), 3, new Date(2025, 0, 15));

    expect(validarVenta(carrito, [arroz])).toEqual({
      ok: false,
      error: "Las existencias de Arroz 1 kg no son suficientes",
    });
  });

  it("acepta la venta con existencias suficientes", () => {
    const carrito = agregar([], producto({ cantidadDisponible: 15 }), 3);

    expect(validarVenta(carrito, [producto({ cantidadDisponible: 15 })])).toEqual({ ok: true });
  });
});

describe("dominio de productos", () => {
  it("detecta productos vencidos y vigentes", () => {
    const hoy = new Date(2025, 0, 15);

    expect(estaVencido(producto({ fechaCaducidad: new Date(2025, 0, 10) }), hoy)).toBe(true);
    expect(estaVencido(producto({ fechaCaducidad: new Date(2025, 0, 30) }), hoy)).toBe(false);
    expect(puedeVenderse(producto({ fechaCaducidad: new Date(2025, 0, 30) }), hoy)).toBe(true);
  });
});

describe("REQ-1.10 alerta de reposición", () => {
  it("genera alerta cuando el saldo alcanza el mínimo", () => {
    const leche = producto({ nombre: "Leche entera", cantidadDisponible: 5, nivelMinimo: 5 });

    expect(calcularAlertasReposicion([leche])).toEqual([leche]);
  });

  it("no genera alerta cuando permanece por encima del mínimo", () => {
    const leche = producto({ nombre: "Leche entera", cantidadDisponible: 19, nivelMinimo: 5 });

    expect(calcularAlertasReposicion([leche])).toEqual([]);
  });
});
