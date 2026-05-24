"use client"
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'
import Link from 'next/link';

// Interfaz para proveedores--
interface Proveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  nombre_contacto: string;
  direccion: string;
  telefono: string;
  correo: string;
  rtn: string;
  estado: string;
}

export default function ModuloProveedor() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  //Nuevos
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const router = useRouter()
  const [nombreContacto, setNombreContacto] = useState('');
  const [rtn, setRtn] = useState('');

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }

  useEffect(() => {
    cargarProveedores();
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

  const cargarProveedores = async () => {
  const { data, error } = await supabase
    .from('proveedor')
    .select('*')
    .order('id_proveedor', { ascending: false });

  if (!error && data) {
    setProveedores(data as Proveedor[]);
  }
};

  const guardarProveedor = async (e: any) => {
    e.preventDefault();

    const datos = {
      nombre_proveedor: nombre,
      nombre_contacto: nombreContacto,
      direccion,
      telefono,
      correo,
      rtn,
      estado: 'activo'
    };

    // Verificar si ya existen los siguientes campos en la DB ----------------------
    // 1. Verificar nombre
  const { data: nombreExistente } = await supabase
    .from("proveedor")
    .select("id_proveedor")
    .eq("nombre_proveedor", nombre)
    .limit(1);

  if (nombreExistente && nombreExistente.length > 0) {
    alert("El nombre del proveedor ya existe");
    return;
  }

  // 2. Verificar RTN
  const { data: rtnExistente } = await supabase
    .from("proveedor")
    .select("id_proveedor")
    .eq("rtn", rtn)
    .limit(1);

  if (rtnExistente && rtnExistente.length > 0) {
    alert("El RTN ya está registrado");
    return;
  }

  // 3. Verificar teléfono
  const { data: telefonoExistente } = await supabase
    .from("proveedor")
    .select("id_proveedor")
    .eq("telefono", telefono)
    .limit(1);

  if (telefonoExistente && telefonoExistente.length > 0) {
    alert("El teléfono ya está registrado");
    return;
  }

  // 4. Verificar correo
  const { data: correoExistente } = await supabase
    .from("proveedor")
    .select("id_proveedor")
    .eq("correo", correo)
    .limit(1);

  if (correoExistente && correoExistente.length > 0) {
    alert("El correo ya está registrado");
    return;
  }
  // Verificar si ya existen los siguientes campos en la DB ----------------------

    
    if (editandoId) {
      const { error } = await supabase
        .from('proveedor')
        .update(datos)
        .eq('id_proveedor', editandoId);

      if (error) alert("Error al actualizar: " + error.message);
      else {
        alert("Proveedor actualizado con éxito");
        setEditandoId(null);
      }
    } else {
      const { error } = await supabase
        .from('proveedor')
        .insert([datos]);

      if (error) alert("Error al guardar: " + error.message);
      else alert("Proveedor registrado con éxito");
    }

    limpiarFormulario();
    cargarProveedores();
  };

  const eliminarProveedor = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este proveedor?")) {
      const { error } = await supabase
        .from('proveedor')
        .delete() 
        .eq('id_proveedor', id);

      if (error) alert("Error al eliminar: " + error.message);
      else cargarProveedores();
    }
  };

  const cambiarEstadoProveedor = async (
  id_proveedor: number,
  estadoActual: string ) => {

  const nuevoEstado =
    estadoActual === "activo"
      ? "inactivo"
      : "activo";
  const { error } = await supabase
    .from("proveedor")
    .update({
      estado: nuevoEstado
    })
    .eq("id_proveedor", id_proveedor);
  if (error) {
    alert("Error al cambiar estado");
    return;
  }
  cargarProveedores();
};

  const prepararEdicion = (prov: Proveedor) => {
    setEditandoId(prov.id_proveedor);
    setNombre(prov.nombre_proveedor);
    setNombreContacto(prov.nombre_contacto);
    setDireccion(prov.direccion);
    setTelefono(prov.telefono);
    setCorreo(prov.correo);
    setRtn(prov.rtn);
  };

  const limpiarFormulario = () => {
    setNombre('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setEditandoId(null);
    setNombreContacto('');
    setRtn('');
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

  // Visual de la Pagina
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
              backgroundColor: '#0F766E',
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


      {/* TÍTULO */}
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
          Gestión de Proveedores
        </h2>
        <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
          Administra proveedores, edita y elimina registros del sistema.
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
          <h3 style={{ marginTop: 0, color: '#0F766E' }}>
            {editandoId ? 'Editando Proveedor' : 'Creando Proveedor'}
          </h3>

          <form onSubmit={guardarProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <input
              placeholder="Nombre del proveedor"
              value={nombre}
              onChange={e => {
                const v = e.target.value;
                if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(v)) setNombre(v);
              }}
              style={inputStyle}
              required
            />

            <input
              placeholder="Nombre del contacto"
              value={nombreContacto}
              onChange={e => setNombreContacto(e.target.value)}
              style={inputStyle}
              required
            />

            <input
              placeholder="Dirección"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              style={inputStyle}
              required
            />

            <input
              placeholder="Teléfono"
              value={telefono}
              onChange={e => {
                const v = e.target.value;
                if (/^\+?[\d\s-]*$/.test(v)) setTelefono(v);
              }}
              style={inputStyle}
              required
            />
            <input
               placeholder="RTN"
               value={rtn}
               onChange={e => setRtn(e.target.value)}
               style={inputStyle}
               required
            />

            <input
              placeholder="Correo"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              onBlur={e => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  alert('Correo inválido');
                }
              }}
              style={inputStyle}
              required
            />

            <button
              type="submit"
              style={{
                marginTop: '10px',
                backgroundColor: editandoId ? '#D97706' : '#0F766E',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {editandoId ? 'Actualizar' : 'Guardar'}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={limpiarFormulario}
                style={{
                  backgroundColor: '#E5E7EB',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>

        {/* TABLA */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            overflowX: 'auto'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6', color: '#0F766E' }}>
                <th style={th}>#</th>
                <th style={th}>Nombre</th>
                <th style={th}>Contacto</th>
                <th style={th}>Dirección</th>
                <th style={th}>Teléfono</th>
                <th style={th}>RTN</th>
                <th style={th}>Correo</th>
                <th style={th}>Estado</th>
                <th style={{ ...th, width: '140px' }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {proveedores.map((p, i) => (
                <tr key={p.id_proveedor} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{p.nombre_proveedor}</td>
                  <td style={td}>{p.nombre_contacto}</td>
                  <td style={td}>{p.direccion}</td>
                  <td style={td}>{p.telefono}</td>
                  <td style={td}>{p.rtn}</td>
                  <td style={td}>{p.correo}</td>
                  <td>
                    <button onClick={() => cambiarEstadoProveedor(p.id_proveedor,p.estado)}
                    style={{ marginLeft: '6px',backgroundColor: p.estado === 'activo' ? '#16A34A': '#DC2626',
                    border: 'none',padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',color: '#fff',
                    fontWeight: 'bold', fontSize: '12px',}}>
                    {p.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>

                  <td style={{ ...td, width: '120px' }}>
                      <div style={{ display: 'flex', gap: '6px'}}>
                        <button onClick={() => prepararEdicion(p)} style={btnEdit}>✎</button>
                        <button onClick={() => eliminarProveedor(p.id_proveedor)} style={btnDelete}>✕</button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {proveedores.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
              No hay proveedores registrados
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
);
}