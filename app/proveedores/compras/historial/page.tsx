"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReporteCompra {
  cantidad: number;
  precio_unitario: number;
  porcentaje_impuesto: number;
  subtotal_linea: number;
  total_linea: number;
  id_compra:number;

  productos: {
    descripcion: string;
  };

  compra: {
    id_compra: number;
    fecha_compra: string;
    numero_documento: string;
    total: number;

    proveedor: {
      nombre_proveedor: string;
    };
  };
}

export default function HistorialCompras() {
  const [reportes, setReportes] = useState<ReporteCompra[]>([]);

  //Nuevos
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const router = useRouter()
  
  
    function cerrarSesion() {
      localStorage.removeItem('miniERPAuth')
      router.push('/')
    }



  useEffect(() => {
    cargarReportes();
  }, []);

  // Use Effects Nuevos
  useEffect(() => {
    const auth = localStorage.getItem('miniERPAuth')
    if (auth !== 'true') {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
      function manejarClickFuera(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuAbierto(false)
        }
      }
  
      document.addEventListener('mousedown', manejarClickFuera)
      return () => {
        document.removeEventListener('mousedown', manejarClickFuera)
      }
    }, [])

   
    const cargarReportes = async () => {
    const { data, error } = await supabase
      .from("detalle_compra")
      .select(`
        cantidad,
        precio_unitario,
        porcentaje_impuesto,
        subtotal_linea,
        total_linea,
        id_compra,
  
        productos(
          descripcion
        ),
  
        compra(
          id_compra,
          numero_documento,
          fecha_compra,
          total,
  
          proveedor(
            nombre_proveedor
          )
        )
      `)
      .order("id_detalle_compra", { ascending: false });
  
    if (error) {
     console.log(error);
     return;
    }

    console.log(data);

    if (data) {
      setReportes(data as any);
    }
  };

  const formatear = (valor: number) => {
    return valor.toLocaleString("es-HN", {
      style: "currency",
      currency: "HNL",
    });
  };


// Estilos de la pagina --------------------------------
  const inputStyle = { padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB',outline: 'none'};
  const th: React.CSSProperties = {padding: '12px', textAlign: 'left', fontSize: '13px',};
  const td: React.CSSProperties = {padding: '12px', fontSize: '13px', color: '#374151'};


  return (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      fontFamily: 'Arial, sans-serif',
      color: '#1F2937',
    }}
  >
    {/* HEADER PROIS */}
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
    <main
      style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
      }}
    >
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
              backgroundColor: '#374151',
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
              backgroundColor: '#0F766E',
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
        }}
      >
        <h2 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>
          Reporte de Compras
        </h2>
        <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
          Historial completo de compras registradas en el sistema.
        </p>
      </div>

      {/* TABLA */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', color: '#0F766E' }}>
              <th style={th}>#</th>
              <th style={th}>Id Compra</th>
              <th style={th}>Num Documento</th>
              <th style={th}>Producto</th>
              <th style={th}>Cantidad</th>
              <th style={th}>Precio Unitario</th>
              <th style={th}>Impuesto</th>
              <th style={th}>Subtotal</th>
              <th style={th}>Total Línea</th>
              <th style={th}>Total Final</th>
              <th style={th}>Proveedor</th>
              <th style={th}>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {reportes.map((r, index) => (
              <tr
                key={index}
                style={{ borderBottom: '1px solid #E5E7EB' }}
              >
                <td style={td}>{index + 1}</td>
                <td style={{...td, textAlign:'left', paddingLeft:'30px'}}>{r.id_compra}</td>
                <td style={td}>{r.compra.numero_documento}</td>
                <td style={td}>{r.productos?.descripcion}</td>
                <td style={{...td, textAlign:'left', paddingLeft:'30px'}}>{r.cantidad}</td>
                <td style={td}>{formatear(r.precio_unitario)}</td>
                <td style={td}>{r.porcentaje_impuesto}%</td>
                <td style={td}>{formatear(r.subtotal_linea)}</td>
                <td style={{...td, fontWeight: 'bold',color: '#16A34A'}}>{formatear(r.total_linea)}</td>
                <td style={td}>{formatear(r.compra.total)}</td>
                <td style={td}>{r.compra.proveedor?.nombre_proveedor}</td>
                <td style={td}>{new Date(r.compra.fecha_compra).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {reportes.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
            No hay compras registradas
          </div>
        )}
      </div>

    </main>
  </div>
);
}