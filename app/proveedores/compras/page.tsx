"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Proveedor {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio_compra: number;
  stock: number;
}

interface DetalleCompra {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export default function ComprasPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);

   //Nuevos
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const router = useRouter()


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
      .select("id, nombre")
      .eq("estado", 1);

    const { data: productosData } = await supabase
      .from("producto")
      .select("*")
      .eq("estado", 1);

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
      (p) => p.id === Number(productoSeleccionado)
    );

    if (!producto) return;

    const subtotal = producto.precio_compra * cantidad;

    const nuevoDetalle: DetalleCompra = {
      id_producto: producto.id,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precio_compra,
      subtotal,
    };

    //setDetalles([...detalles, nuevoDetalle]);

    // Evitar Productos duplicados --------------------------
    const existe = detalles.find(
        (d) => d.id_producto === producto.id
    );

    if (existe) {
        const nuevosDetalles = detalles.map((d) =>
            d.id_producto === producto.id ? {
                ...d,
              cantidad: d.cantidad + cantidad,
              subtotal:
              (d.cantidad + cantidad) * d.precio,
            } : d
        );

        setDetalles(nuevosDetalles);
    } else {
     setDetalles([...detalles, nuevoDetalle]);
    }
    // Evitar Productos duplicados --------------------------


    setProductoSeleccionado("");
    setCantidad(1);
  };

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles.splice(index, 1);
    setDetalles(nuevosDetalles);
  };

  const total = detalles.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );

  const guardarCompra = async () => {
    if (!proveedorSeleccionado) {
      alert("Selecciona un proveedor");
      return;
    }

    if (detalles.length === 0) {
      alert("Agrega productos");
      return;
    }

    // 1. Crear compra ---------------------------------------------
    const { data: compraData, error: compraError } = await supabase
      .from("compra")
      .insert([
        {
          id_proveedor: proveedorSeleccionado,
          total: total,
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
      id_compra: compraData.id,
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio,
      subtotal: d.subtotal,
    }));

    const { error: detalleError } = await supabase
      .from("detalle_compra")
      .insert(detallesInsert);

    if (detalleError) {
      alert("Error al registrar detalles");
      console.log(detalleError);
      return;
    }

    alert("Compra registrada correctamente");

    setDetalles([]);
    setProveedorSeleccionado("");
  };

// Estilos de la pagina --------------------------------
  const inputStyle = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
  outline: 'none',
};

const th: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    fontSize: '13px',
};

const td: React.CSSProperties = {
    padding: '12px',
    fontSize: '13px',
    color: '#374151',
};

const btnEdit = {
  marginRight: '6px',
  backgroundColor: '#F59E0B',
  border: 'none',
  padding: '6px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#fff',
};

const btnDelete = {
  backgroundColor: '#EF4444',
  border: 'none',
  padding: '6px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#fff',
};

  return (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      fontFamily: 'Arial, sans-serif',
      color: '#1F2937',
    }}
  >
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
        maxWidth: '1280px',
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
          Registro de Compras
        </h2>
        <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
          Selecciona proveedor, agrega productos y registra la compra.
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
          <h3 style={{ marginTop: 0, color: '#0F766E' }}>Nueva Compra</h3><br />

          {/* PROVEEDOR */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280' }}>Proveedor </label>
            <select
              value={proveedorSeleccionado}
              onChange={(e) => setProveedorSeleccionado(e.target.value)}
              style={inputStyle}
            >
              <option value="">Seleccionar</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* PRODUCTO */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280' }}>Producto </label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              style={inputStyle}
            >
              <option value="">Seleccionar</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* CANTIDAD */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280' }}>Cantidad </label>
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
                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={td}>{d.nombre}</td>
                  <td style={td}>{d.cantidad}</td>
                  <td style={td}>L {d.precio}</td>
                  <td style={td}>L {d.subtotal}</td>
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
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
              style={{
                padding: '10px 16px',
                backgroundColor: detalles.length === 0 ? '#16A34A':'#374151' ,
                color: '#FFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}

            onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                detalles.length === 0 ? '#374151' : '#22C55E';
            }}

            onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                detalles.length === 0 ? '#4B5563' : '#16A34A';
            }}
            >
                
              Registrar Compra
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
);
}