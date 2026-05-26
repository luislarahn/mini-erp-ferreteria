"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Proveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  estado: string;
}

interface Producto {
  id_producto: number;
  descripcion: string;
  precio_compra: number;
  stock_actual: number;
  impuesto: number;
}

interface DetalleCompra {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number;
  porcentaje_impuesto: number;
  subtotal_linea: number;
  total_linea: number;
}

function ComprasContent() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);

   //Nuevos
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams();
  const ordenId = searchParams.get("orden");

 const [numeroOrden, setNumeroOrden] = useState("");
 const [nombreProveedor, setNombreProveedor] = useState("");

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }
 
  useEffect(() => {
    cargarDatos();
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

  useEffect(() => {
  if (!ordenId) return;

  cargarOrden();
}, [ordenId]);



   // cargar orden------------------------------------------
   const cargarOrden = async () => {

  // =====================================
  // OBTENER ORDEN
  // =====================================
  const { data: ordenData, error: ordenError } = await supabase
    .from("orden_compra")
    .select(`
      numero_orden,
      id_proveedor
    `)
    .eq("id_orden_compra", ordenId)
    .single();

  if (ordenError) {
    console.log(ordenError);
    return;
  }

  // =====================================
  // OBTENER PROVEEDOR
  // =====================================
  const { data: proveedorData, error: proveedorError } = await supabase
    .from("proveedor")
    .select(`
      id_proveedor,
      nombre_proveedor,
      estado
    `)
    .eq("id_proveedor", ordenData.id_proveedor)
    .single();

  if (proveedorError) {
    console.log(proveedorError);
    return;
  }

  // =====================================
  // SETEAR DATOS
  // =====================================
  setProveedorSeleccionado(
    proveedorData.id_proveedor.toString()
  );

  setNombreProveedor(
    proveedorData.nombre_proveedor
  );

  setNumeroOrden(
    ordenData.numero_orden
  );

  // =====================================
  // OBTENER DETALLES
  // =====================================
  const { data: detallesData, error: detallesError } = await supabase
    .from("detalle_orden_compra")
    .select(`
      id_producto,
      cantidad,
      precio_unitario,
      porcentaje_impuesto,
      subtotal_linea,
      total_linea
    `)
    .eq("id_orden_compra", ordenId);

  if (detallesError) {
    console.log(detallesError);
    return;
  }

  // =====================================
  // OBTENER PRODUCTOS
  // =====================================
  const idsProductos = detallesData.map(
    (d) => d.id_producto
  );

  const { data: productosData, error: productosError } = await supabase
    .from("productos")
    .select(`
      id_producto,
      descripcion
    `)
    .in("id_producto", idsProductos);

  if (productosError) {
    console.log(productosError);
    return;
  }

  // =====================================
  // MAPEAR DETALLES
  // =====================================
  const detallesMapeados = detallesData.map((d) => {

    const producto = productosData.find(
      (p) => p.id_producto === d.id_producto
    );

    return {
      id_producto: d.id_producto,

      nombre: producto?.descripcion || "Producto",

      cantidad: d.cantidad,

      precio: d.precio_unitario,

      porcentaje_impuesto: d.porcentaje_impuesto,

      subtotal_linea: d.subtotal_linea,

      total_linea: d.total_linea,
    };
  });

  setDetalles(detallesMapeados);
};




  // Cargar Datos ------------------------------------------
  const cargarDatos = async () => {
    const { data: proveedoresData } = await supabase
      .from("proveedor")
      .select("id_proveedor, nombre_proveedor, estado")
      .eq("estado", "activo");

    const { data: productosData } = await supabase
      .from("productos")
      .select(`
      id_producto,
      descripcion,
      precio_compra,
      stock_actual,
      impuesto`);

    if (proveedoresData) setProveedores(proveedoresData);
    if (productosData) setProductos(productosData);
  };

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles.splice(index, 1);
    setDetalles(nuevosDetalles);
  };

  const total = detalles.reduce(
  (acc, item) => acc + item.total_linea, 0 );

  const guardarCompra = async () => {

    const proveedor = proveedores.find(
      p => p.id_proveedor === Number(proveedorSeleccionado)
    );

    if (proveedor?.estado !== "activo") {
      alert("No puedes comprar a un proveedor inactivo");
      return;
    }

    if (!proveedorSeleccionado) {
      alert("Selecciona un proveedor");
      return;
    }

    if (detalles.length === 0) {
      alert("Agrega productos");
      return;
    }

    const subtotal = detalles.reduce((acc, item) => {
    const base = item.precio * item.cantidad;
    return acc + base;
    }, 0);

    const impuesto_total = detalles.reduce((acc, item) => {
    const base = item.precio * item.cantidad;
    const impuesto = base * 0.15; // o item.impuesto si lo tienes guardado
    return acc + impuesto;
    }, 0);

    const total_final = subtotal + impuesto_total;

    const numero_documento = `C-${Date.now()}`;

    // 1. Crear compra ---------------------------------------------
    const { data: compraData, error: compraError } = await supabase
   .from("compra")
   .insert([{
       id_proveedor: proveedorSeleccionado,
       numero_documento,
       subtotal,
       impuesto_total,
       total: total_final,
       estado: "completada",
       fecha_compra: new Date().toISOString(),
     },
   ])
   .select()
   .single();

    if (compraError) {
      alert("Error al registrar compra");
      console.log(compraError);
      return;
    }

    // 2. Crear detalles ---------------------------------------------
    const detallesInsert = detalles.map((d) => ({
      id_compra: compraData.id_compra,
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio,
      porcentaje_impuesto: d.porcentaje_impuesto,
      subtotal_linea: d.subtotal_linea,
      total_linea: d.total_linea,
    }));

    const { error: detalleError } = await supabase
      .from("detalle_compra")
      .insert(detallesInsert);
      
    if (detalleError) {
      alert("Error al registrar detalles");
      console.log(detalleError);
      return;
    }

    // 3. Actualizar stock de productos -----------------------------
    for (const d of detalles) {
    
      // Obtener stock actual
      const productoActual = productos.find(
        (p) => p.id_producto === d.id_producto
      );
    
      if (!productoActual) continue;
    
      const nuevoStock =
        productoActual.stock_actual + d.cantidad;
    
      const { error: stockError } = await supabase
        .from("productos")
        .update({
          stock_actual: nuevoStock
        })
        .eq("id_producto", d.id_producto);
    
      if (stockError) {
        console.log(stockError);
        alert("Error al actualizar stock");
        return;
      }
    }

  await supabase
  .from("orden_compra")
  .update({
    estado: "completada"
  })
  .eq("id_orden_compra", ordenId);

  alert("Compra registrada correctamente");

  router.push("/proveedores/compras/historial");
  };
  

// Estilos de la pagina --------------------------------
  const inputStyle = { padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB',outline: 'none'};
  const th: React.CSSProperties = {padding: '12px', textAlign: 'left', fontSize: '13px',};
  const td: React.CSSProperties = {padding: '12px', fontSize: '13px', color: '#374151'};

  return (
  <div style={{minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Arial, sans-serif',color: '#1F2937',}}>

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
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Compras
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
        }}
      >
        <h2 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>
          Compra por Orden
        </h2>
        <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
          Proveedor: {nombreProveedor} | Orden: {numeroOrden}
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
                <th style={th}>Producto</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Precio</th>
                <th style={th}>Subtotal</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>


            {/* Aqui rellenar con la informacion del historial de Ordenes*/}
            <tbody>
              {detalles.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={td}>{d.nombre}</td>
                  <td style={td}>{d.cantidad}</td>
                  <td style={td}>L {d.precio}</td>
                  <td style={td}>L {d.total_linea}</td>
                  <td style={td}>
                    <button
                      onClick={() => eliminarDetalle(i)}
                      style={{
                        backgroundColor: '#EF4444',
                        color: '#FFF',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {detalles.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
            No hay productos agregados
          </div>)}


          {/* TOTAL */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>Total: L {total}</h3>

            <button
              onClick={guardarCompra}
              disabled={detalles.length === 0}
              style={{
                padding: '10px 16px',
                backgroundColor: detalles.length === 0 ? '#374151':'#22C55E' ,
                color: '#FFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            > Registrar Compra
            </button>
          </div>
        </div>
     
    </main>
  </div>
);

}

export default function ComprasPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ComprasContent />
    </Suspense>
  );
}