"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

interface Orden {
  id_orden_compra: number;
  numero_orden: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  observaciones: string;
  created_at: string;

  proveedor: {
    nombre_proveedor: string;
    nombre_contacto: string;
    rtn: string;
    telefono: string;
    correo: string;
    direccion: string;
  };

  detalle_orden_compra: {
    cantidad: number;
    precio_unitario: number;
    porcentaje_impuesto: number;
    subtotal_linea: number;
    total_linea: number;

    productos: {
      descripcion: string;
      unidad_medida: string;
    };
  }[];
}

export default function ImprimirOrdenPage() {

  const params = useParams();

  const [orden, setOrden] = useState<Orden | null>(null);

  useEffect(() => {
    cargarOrden();
  }, []);

  // Nombre del archivo PDF
  useEffect(() => {
  if (orden) {
    document.title = `PROIS - Orden ${orden.numero_orden}`;
  }
  }, [orden]);


  const cargarOrden = async () => {

    const { data, error } = await supabase
      .from("orden_compra")
      .select(`
        *,
        proveedor (
          nombre_proveedor,
          nombre_contacto,
          rtn,
          telefono,
          correo,
          direccion
        ),
        detalle_orden_compra (
          cantidad,
          precio_unitario,
          porcentaje_impuesto,
          subtotal_linea,
          total_linea,

          productos (
            descripcion,
            unidad_medida
          )
        )
      `)
      .eq("id_orden_compra", params.id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setOrden(data as any);
  };

  const confirmarEmision = async () => {

    if (!orden) return;

    const { error } = await supabase
      .from("orden_compra")
      .update({
        estado: "emitida",
      })
      .eq("id_orden_compra", orden.id_orden_compra);

    if (error) {
      console.log(error);
      alert("Error al confirmar emisión");
      return;
    }

    alert("Orden emitida correctamente");
    window.history.back()
  };

  if (!orden) {
    return <div style={{ padding: "40px" }}>Cargando...</div>;
  }

  


  const th: React.CSSProperties = {
   border: "1px solid #D1D5DB",
   padding: "12px",
   textAlign: "left",
   fontSize: "13px",
   color: "#111827",
   fontWeight: "bold",
  };

 const td: React.CSSProperties = {
   border: "1px solid #E5E7EB",
   padding: "12px",
   fontSize: "13px",
   color: "#111827",
  };

  return (
    <div
      style={{
        backgroundColor: "#F3F4F6",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >

      {/* BOTONES */}
        <div
            className="no-print"
            style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
        }}
>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: "auto"
          }}
        >
          Imprimir / Guardar PDF
        </button>

        <button
         onClick={confirmarEmision}
        style={{
            backgroundColor: "#0F766E",
            color: "#FFFFFF",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
        }}
        >
         Confirmar emisión
        </button>
    
        <button
         onClick={() => window.history.back()}
        style={{
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            border: "none",
            padding: "12px 18px",
          borderRadius: "10px",
         cursor: "pointer",
            fontWeight: "bold",
        }}
        >
         Cancelar
        </button>
      </div>

      {/* DOCUMENTO */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "30px",
          boxShadow: "0 0 20px rgba(0,0,0,0.10)",
          color: "#111827",
        }}
        >

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >

          <div>
            <h1
              style={{
                margin: 0,
                color: "#0F172A",
              }}
            >
              Ferretería PROIS
            </h1>

            <p>RTN: 08011999123456</p>
            <p>Tegucigalpa, Honduras</p>
            <p>Tel: +504 2222-2222</p>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#2563EB",
              }}
            >
              ORDEN DE COMPRA
            </h2>

            <p>
              <strong>No:</strong> {orden.numero_orden}
            </p>

            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(orden.created_at).toLocaleDateString()}
            </p>

            <p>
              <strong>Estado:</strong> {orden.estado}
            </p>
          </div>

        </div>

        {/* PROVEEDOR */}
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              borderBottom: "1px solid #E5E7EB",
              paddingBottom: "10px",
            }}
          >
            Datos del proveedor
          </h3>

          <p>
            <strong>Proveedor:</strong>{" "}
            {orden.proveedor.nombre_proveedor}
          </p>

          <p>
            <strong>Contacto:</strong>{" "}
            {orden.proveedor.nombre_contacto}
          </p>

          <p>
            <strong>RTN:</strong>{" "}
            {orden.proveedor.rtn}
          </p>

          <p>
            <strong>Teléfono:</strong>{" "}
            {orden.proveedor.telefono}
          </p>

          <p>
            <strong>Correo:</strong>{" "}
            {orden.proveedor.correo}
          </p>

          <p>
            <strong>Dirección:</strong>{" "}
            {orden.proveedor.direccion}
          </p>
        </div>

        {/* TABLA */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "30px",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >

          <thead>

            <tr
              style={{
                backgroundColor: "#F3F4F6",
              }}
            >
              <th style={th}>Producto</th>
              <th style={th}>Unidad</th>
              <th style={th}>Cantidad</th>
              <th style={th}>Precio</th>
              <th style={th}>ISV</th>
              <th style={th}>Total</th>
            </tr>

          </thead>

          <tbody>

            {orden.detalle_orden_compra.map((d, index) => (

              <tr key={index}>

                <td style={td}>
                  {d.productos.descripcion}
                </td>

                <td style={td}>
                  {d.productos.unidad_medida}
                </td>

                <td style={td}>
                  {d.cantidad}
                </td>

                <td style={td}>
                  L {d.precio_unitario.toFixed(2)}
                </td>

                <td style={td}>
                  {d.porcentaje_impuesto}%
                </td>

                <td style={td}>
                  L {d.total_linea.toFixed(2)}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {/* TOTALES */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >

          <div
            style={{
              width: "300px",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <strong>Subtotal:</strong>
              <span>L {orden.subtotal.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <strong>ISV:</strong>
              <span>L {orden.impuesto.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "20px",
                color: "#0F766E",
              }}
            >
              <strong>Total:</strong>
              <strong>L {orden.total.toFixed(2)}</strong>
            </div>

          </div>

        </div>

        {/* OBSERVACIONES */}
        <div
          style={{
            marginTop: "50px",
          }}
        >
          <h3>Observaciones</h3>

          <p>
            {orden.observaciones || "Sin observaciones"}
          </p>
        </div>

        {/* FIRMAS */}
        <div
         style={{
            marginTop: "80px",
            display: "flex",
            justifyContent: "space-between",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
          >

          <div
            style={{
              width: "250px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                borderTop: "1px solid black",
                paddingTop: "10px",
              }}
            >
              Autorizado por
            </div>
          </div>

          <div
            style={{
              width: "250px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                borderTop: "1px solid black",
                paddingTop: "10px",
              }}
            >
              Recibido por
            </div>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @media print {

        @page { size: auto; margin: 10mm;}

        .no-print { display: none !important;}

        body {background: white !important;}}`}
</style>

    </div>
  );
}

