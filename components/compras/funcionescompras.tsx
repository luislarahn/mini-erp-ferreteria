import { supabase } from "@/lib/supabase";

// =============================
// CALCULOS
// =============================

export function calcularSubtotalLinea(
  cantidad: number,
  precio_unitario: number
) {
  return cantidad * precio_unitario;
}

export function calcularImpuesto(
  subtotal: number,
  porcentaje_impuesto: number
) {
  return subtotal * (porcentaje_impuesto / 100);
}

export function calcularTotalLinea(
  cantidad: number,
  precio_unitario: number,
  porcentaje_impuesto: number
) {
  const subtotal = calcularSubtotalLinea(
    cantidad,
    precio_unitario
  );

  const impuesto = calcularImpuesto(
    subtotal,
    porcentaje_impuesto
  );

  return subtotal + impuesto;
}

export function calcularTotalCompra(detalles: any[]) {
  let subtotal = 0;
  let impuesto_total = 0;
  let total = 0;

  detalles.forEach((detalle) => {
    subtotal += detalle.subtotal_linea;

    impuesto_total +=
      detalle.total_linea - detalle.subtotal_linea;

    total += detalle.total_linea;
  });

  return {
    subtotal,
    impuesto_total,
    total,
  };
}

// =============================
// PROVEEDORES
// =============================

export async function getDatosProveedor(
  id_proveedor: number
) {
  const { data, error } = await supabase
    .from("proveedor")
    .select("*")
    .eq("id_proveedor", id_proveedor)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function actualizarInformacionProveedor(
  id_proveedor: number,
  datos: any
) {
  const { data, error } = await supabase
    .from("proveedor")
    .update(datos)
    .eq("id_proveedor", id_proveedor);

  if (error) {
    console.error(error);
  }

  return data;
}

export async function esProveedorActivo(
  id_proveedor: number
) {
  const { data, error } = await supabase
    .from("proveedor")
    .select("estado")
    .eq("id_proveedor", id_proveedor)
    .single();

  if (error) {
    console.error(error);
    return false;
  }

  return data.estado === "activo";
}

// =============================
// COMPRAS
// =============================

export async function registrarCompra(
  compra: any,
  detalles: any[]
) {
  try {
    // 1. Insertar compra
    const { data: compraData, error: compraError } =
      await supabase
        .from("compra")
        .insert([compra])
        .select()
        .single();

    if (compraError) throw compraError;

    const id_compra = compraData.id_compra;

    // 2. Insertar detalles
    const detallesConCompra = detalles.map(
      (detalle) => ({
        ...detalle,
        id_compra,
      })
    );

    const { error: detalleError } =
      await supabase
        .from("detalle_compra")
        .insert(detallesConCompra);

    if (detalleError) throw detalleError;

    return compraData;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function anularCompra(
  id_compra: number
) {
  const { data, error } = await supabase
    .from("compra")
    .update({
      estado: "anulada",
    })
    .eq("id_compra", id_compra);

  if (error) {
    console.error(error);
  }

  return data;
}

export async function getDetalles(
  id_compra: number
) {
  const { data, error } = await supabase
    .from("detalle_compra")
    .select(`
      *,
      producto(*)
    `)
    .eq("id_compra", id_compra);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

// =============================
// PAGOS
// =============================

export async function registrarPago(
  pago: any
) {
  const { data, error } = await supabase
    .from("pago_proveedor")
    .insert([pago])
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function anularPago(
  id_pago: number
) {
  const { data, error } = await supabase
    .from("pago_proveedor")
    .update({
      estado: "anulado",
    })
    .eq("id_pago", id_pago);

  if (error) {
    console.error(error);
  }

  return data;
}

export async function getResumenPago(
  id_pago: number
) {
  const { data, error } = await supabase
    .from("pago_proveedor")
    .select(`
      *,
      proveedor(*),
      compra(*)
    `)
    .eq("id_pago", id_pago)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}