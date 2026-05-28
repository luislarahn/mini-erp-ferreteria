"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Orden {
  id_orden_compra: number;
  numero_orden: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  created_at: string;

  proveedor: {
    nombre_proveedor: string;
  };
}

export default function HistorialOrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // nuevo estado para filtrar ordenes
  const [busquedaOrden, setBusquedaOrden] = useState("");

  function cerrarSesion() {
    localStorage.removeItem("miniERPAuth");
    router.push("/");
  }

  useEffect(() => {
    cargarOrdenes();
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("miniERPAuth");
    if (auth !== "true") {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    function manejarClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  const cargarOrdenes = async () => {
    const { data, error } = await supabase
      .from("orden_compra")
      .select(`
        id_orden_compra,
        numero_orden,
        subtotal,
        impuesto,
        total,
        estado,
        created_at,
        proveedor (
          nombre_proveedor
        )
      `)
      .order("id_orden_compra", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }


    const ordenEstados: Record<string, number> = {
      pendiente: 1,
      emitida: 2,
      aceptada: 3,
      completada:4,
      cancelada: 5,
    };
    data.sort((a: any, b: any) => {
        return ordenEstados[a.estado] - ordenEstados[b.estado];
    });


    setOrdenes(data as any);
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {


  const { error } = await supabase
      .from("orden_compra")
      .update({ estado: nuevoEstado })
      .eq("id_orden_compra", id);

    if (error) {
        console.log(error);
        alert("Error al cambiar estado");
        return;
     }

  // recargar tabla
  cargarOrdenes();
  };

   // Imprimir
  const imprimirOrden = async (id: number) => {

  window.print();

  const { error } = await supabase
    .from("orden_compra")
    .update({ estado: "emitida" })
    .eq("id_orden_compra", id);

  if (error) {
    console.log(error);
    alert("Error al imprimir");
    return;
  }

  cargarOrdenes();
  };

  const formatear = (valor: number) => {
    return valor.toLocaleString("es-HN", {
      style: "currency",
      currency: "HNL",
    });
  };
  
  const ordenesFiltradas = ordenes.filter((o) =>
  o.numero_orden.toLowerCase().includes(busquedaOrden.toLowerCase()) ||
  o.proveedor?.nombre_proveedor
    ?.toLowerCase()
    .includes(busquedaOrden.toLowerCase())
);

  const th: React.CSSProperties = {
    padding: "12px",
    textAlign: "left",
    fontSize: "13px",
  };

  const td: React.CSSProperties = {
    padding: "12px",
    fontSize: "13px",
    color: "#374151",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F3F4F6", fontFamily: "Arial, sans-serif", color: "#1F2937" }}>

      {/* HEADER (igual al sistema PROIS) ------------------------- */}
    <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>
              Ferretería PROIS
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
              “Todo para construir con confianza.”
            </p>
          </div>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 8px 18px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                A
              </span>
              Admin
              <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
            </button>

            {menuAbierto && (
              <div style={{ position: 'absolute', top: '58px', right: 0, width: '220px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 18px 35px rgba(0,0,0,0.10)', overflow: 'hidden', zIndex: 1000 }}>
                <Link href="/documentacion" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Documentación
                </Link>
                <Link href="/soporte" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Soporte
                </Link>
                <Link href="/preferencias" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Preferencias
                </Link>
                <button onClick={cerrarSesion} style={{ width: '100%', textAlign: 'left', padding: '13px 16px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 'bold' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    {/* HEADER (igual al sistema PROIS) ------------------------- */}


      {/* MAIN */}
      <main style={{ maxWidth: "1600px", margin: "0 auto", padding: "32px" }}>
        
        {/* LINKS */}
        <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#374151', textDecoration: 'none', fontWeight: 'bold', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          ← Volver al dashboard
        </a>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>

          <a
            href="/proveedores"
            style={{
              padding: '10px 14px',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Gestión de Proveedores
          </a>

          <a
            href="/proveedores/ordenes"
            style={{
              padding: '10px 14px',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
             }}>
            Órdenes de Compra
           </a>

           <a href="/proveedores/ordenes/historial"
           style={{
              padding: '10px 14px',
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
             }}>
            Historial de Órdenes
           </a>

          <a
            href="/proveedores/compras"
            style={{
              padding: '10px 14px',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Ir a Compras
          </a>

          <a
            href="/proveedores/compras/historial"
            style={{
              padding: '10px 14px',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Reporte de Compras
          </a>

        </div><br />

       {/* TITULO */}
        <div
         style={{
           backgroundColor: '#FFFFFF',
           border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
           marginBottom: '24px',
            display: 'flex',
           justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >

         <div>
           <h2 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>
             Lista de órdenes generadas al proveedor
           </h2>

           <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
              Historial completo de Ordenes registradas en el sistema.
           </p>
          </div>

         <input
            type="text"
            placeholder="Buscar orden..."
           value={busquedaOrden}
           onChange={(e) => setBusquedaOrden(e.target.value)}
           style={{
             padding: '12px',
             borderRadius: '12px',
             border: '1px solid #D1D5DB',
             outline: 'none',
             minWidth: '260px',
             fontSize: '14px',
            }}
          />

        </div>

        {/* TABLA */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F3F4F6" }}>
                <th style={th}>Orden</th>
                <th style={th}>Proveedor</th>
                <th style={th}>Subtotal</th>
                <th style={th}>Impuesto</th>
                <th style={th}>Total</th>
                <th style={{...td, textAlign:'left', paddingLeft:'120px'}}>Acciones</th>
                <th style={{...td, textAlign:'left', paddingLeft:'75px'}}>Estado</th>
                <th style={th}>Fecha</th>
              </tr>
            </thead>

            <tbody>
              {ordenesFiltradas.map((o) => (
                <tr key={o.id_orden_compra} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={td}>{o.numero_orden}</td>

                  <td style={td}>{o.proveedor?.nombre_proveedor}</td>

                  <td style={td}>{formatear(o.subtotal)}</td>

                  <td style={td}>{formatear(o.impuesto)}</td>

                  <td style={{ ...td, fontWeight: "bold", color: "#16A34A" }}>
                    {formatear(o.total)}
                  </td>

                    <td style={td}>

                     {o.estado === "pendiente" && (
                      <div
                       style={{
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Link
                          href={`/proveedores/ordenes/imprimir/${o.id_orden_compra}`}
                          style={{
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            minWidth: '186px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            textAlign: 'center',
                          }}
                        >
                          Imprimir Orden
                        </Link>
                     </div>
                    )}

                     {o.estado === "emitida" && (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',}}>
                        <div style={{display: 'flex', gap: '6px', justifyContent: 'center',}}>
                    <button
                     onClick={() => cambiarEstado(o.id_orden_compra, "aceptada")}
                     style={{
                        backgroundColor: '#03b815c6',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minWidth: '90px',
                        }}
                    >
                        Aceptar
                    </button>
                       
                    <button
                     onClick={() => cambiarEstado(o.id_orden_compra, "cancelada")}
                     style={{
                        backgroundColor: '#b20404c6',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minWidth: '90px',
                     }}
                    >
                        Cancelar
                    </button>
                     </div>

                    </div>
                    )}

                    {o.estado === "aceptada" && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',}}>
                          <Link
                            href={`/proveedores/compras?orden=${o.id_orden_compra}`}
                             style={{
                                backgroundColor: "#128177", color: "#fff", border: "none", padding: "8px 12px",
                                borderRadius: "6px", cursor: "pointer", textDecoration: "none", fontSize: "12px",
                                fontWeight: "bold", display: "inline-block", textAlign: "center",
                                }}>
                                    Generar compra
                          </Link>
                        </div>
                        )}
                    </td>

                <td style={td}>
                     <div style={{ display: 'flex', flexDirection: 'column',  alignItems: 'center', gap: '10px',}}>
                        <span
                           style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                            minWidth: "110px",
                            textAlign: "center",
                            backgroundColor:
                                 o.estado === "pendiente" ? "#2563EB"
                               : o.estado === "emitida" ? "#F59E0B"
                               : o.estado === "aceptada" ? "#128177"
                               : o.estado === "completada" ? "#2e9107"
                               : "#EF4444"
                            }}
                           >
                             {o.estado}
                        </span>

                    </div>
                </td>

                  <td style={td}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ordenes.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
              No hay órdenes registradas
            </div>
          )}
        </div>
      </main>
    </div>
  );
}