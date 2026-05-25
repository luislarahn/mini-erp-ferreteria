"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface DetalleOrden {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number;
  porcentaje_impuesto: number;
  subtotal_linea: number;
  total_linea: number;
}

export default function OrdenesPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [detalles, setDetalles] = useState<DetalleOrden[]>([]);

   //Nuevos
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const router = useRouter()

  const [filtroProducto, setFiltroProducto] = useState("");


  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }


    //Formatear moneda
    const formatearMoneda = (valor: number) => {
     return valor.toLocaleString("es-HN", {
      style: "currency",
      currency: "HNL",
     });
    };


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

  // Agregar Productos -------------------------------------
  const agregarProducto = () => {

    
    if (!productoSeleccionado || cantidad <= 0) {
      alert("Selecciona un producto válido");
      return;
    }

    const producto = productos.find(
      (p) => p.id_producto === Number(productoSeleccionado)
    );
    
    if (!producto) return;

   const subtotal_linea = producto.precio_compra * cantidad;

   const impuesto = subtotal_linea * (producto.impuesto / 100);

   const total_linea = subtotal_linea + impuesto;

   const nuevoDetalle: DetalleOrden = {
    id_producto: producto.id_producto,
    nombre: producto.descripcion,
    cantidad,
    precio: producto.precio_compra,
    porcentaje_impuesto: producto.impuesto,
    subtotal_linea,
    total_linea,
   };


   // Evitar Productos duplicados --------------------------
   const existe = detalles.find(
     (d) => d.id_producto === producto.id_producto
   );
   
   if (existe) {
   
     const nuevosDetalles = detalles.map((d) => {
   
       if (d.id_producto === producto.id_producto) {
   
         const nuevaCantidad = d.cantidad + cantidad;
   
         const base = nuevaCantidad * d.precio;
   
         const impuesto = base * (producto.impuesto / 100);
   
         const total = base + impuesto;
   
         return {
            ...d,
            cantidad: nuevaCantidad,
            subtotal_linea: base,
            total_linea: total,
        };
       }
   
       return d;
     });
   
     setDetalles(nuevosDetalles);
   
   } else {
   
     setDetalles([...detalles, nuevoDetalle]);
   }
   
   setProductoSeleccionado("");
   setCantidad(1);
    };

  
  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles.splice(index, 1);
    setDetalles(nuevosDetalles);
  };

  const total = detalles.reduce(
  (acc, item) => acc + item.total_linea, 0 );


  // Guardar orden --------------------------------------
  const guardarOrden = async () => {
     const proveedor = proveedores.find(
    p => p.id_proveedor === Number(proveedorSeleccionado)
  );

  if (proveedor?.estado !== "activo") {
    alert("Proveedor inactivo");
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

  const subtotal = detalles.reduce(
    (acc, item) => acc + item.subtotal_linea,
    0
  );

  const impuesto = detalles.reduce(
    (acc, item) =>
      acc + (item.total_linea - item.subtotal_linea),
    0
  );

  const total = subtotal + impuesto;

  const numero_orden = `OC-${Date.now()}`;

  // 1. GUARDAR ORDEN
  const { data: ordenData, error: ordenError } = await supabase
    .from("orden_compra")
    .insert([
      {
        numero_orden,
        id_proveedor: proveedorSeleccionado,
        subtotal,
        impuesto,
        total,
        estado: "emitida",
      },
    ])
    .select()
    .single();

  if (ordenError) {
    console.log(ordenError);
    alert("Error al generar orden");
    return;
  }

  // 2. GUARDAR DETALLES
  const detallesInsert = detalles.map((d) => ({
    id_orden_compra: ordenData.id_orden_compra,
    id_producto: d.id_producto,
    cantidad: d.cantidad,
    precio_unitario: d.precio,
    porcentaje_impuesto: d.porcentaje_impuesto,
    subtotal_linea: d.subtotal_linea,
    total_linea: d.total_linea,
  }));

  const { error: detalleError } = await supabase
    .from("detalle_orden_compra")
    .insert(detallesInsert);

  if (detalleError) {
    console.log(detalleError);
    alert("Error al registrar detalles");
    return;
  }

  alert("Orden generada correctamente");

  setDetalles([]);
  setProveedorSeleccionado("");
    
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
    <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px', }}
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
              backgroundColor: '#0F766E',
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
          Orden de Compra
        </h2>
        <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
          Genera órdenes de compra para proveedores.
        </p>
      </div>

      {/* GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px',
        }}
      >

        {/* FORMULARIO */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            height: 'fit-content',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#0F766E' }}>Nueva Orden</h3><br />

          {/* SELECCIONAR PROVEEDOR */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280' }}>Proveedor </label><br />

            <select
              value={proveedorSeleccionado}
              onChange={(e) => setProveedorSeleccionado(e.target.value)}
              style={inputStyle}
            >
              <option disabled value="">Seleccionar proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                   {p.nombre_proveedor} ({p.estado})

                </option>
              ))}
            </select>

          </div>

          {/* PRODUCTO */}
          <div style={{ marginBottom: '12px'}}>

            <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Producto </label>
               
            <input
              type="text"
              placeholder="Buscar producto..."
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              style={{ ...inputStyle, marginBottom: '12px', display: 'block' }} />
           
              <select
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
                style={{ ...inputStyle, display: 'block' }}>
                <option value="">
                  {filtroProducto ? "Ver productos encontrados" : "Seleccionar producto"}
                </option>

                {productos
                .filter((p) =>p.descripcion.toLowerCase().includes(filtroProducto.toLowerCase()))
                .map((p) => (
                    <option key={p.id_producto} value={p.id_producto}> 
                      {p.descripcion} (Stock: {p.stock_actual})
                    </option>
                ))}
              </select>
          </div>


          {/* CANTIDAD */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280' }}>Cantidad </label><br />
            <input
              type="number"
              value={cantidad}
              onChange={(e) => {
              const valor = Number(e.target.value);

              if (valor > 100) {
              setCantidad(100);
              } else if (valor < 1) {
              setCantidad(1);
              } else {
              setCantidad(valor);
              }
              }}
              style={inputStyle}
            />
          </div>

          <button
            onClick={agregarProducto}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Agregar Producto
          </button>
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

            <tbody>
              {detalles.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #5f6166' }}>
                  <td style={td}>{d.nombre}</td>
                  <td style={td}>{d.cantidad}</td>
                  <td style={td}>L {d.precio}</td>
                  <td style={td}>L {d.total_linea}</td>
                  <td style={td}>
                    <button
                      onClick={() => eliminarDetalle(i)}
                      style={{
                        backgroundColor: '#b20404c6',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      X
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
              onClick={guardarOrden}
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
            > Generar Orden
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
);
}