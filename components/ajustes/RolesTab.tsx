 'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Rol = {
  id_rol: number
  nombre_rol: string
  descripcion: string
  permisos: string[]
}

const PERMISOS_DISPONIBLES = [
  'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
  'clientes.ver', 'clientes.crear', 'clientes.editar',
  'proveedores.ver', 'proveedores.crear', 'proveedores.editar',
  'personal.ver', 'personal.crear', 'personal.editar',
  'ajustes.ver', 'ajustes.editar',
  'reportes.ver', 'reportes.exportar',
]

const ROLES_INICIALES: Rol[] = [
  { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema', permisos: PERMISOS_DISPONIBLES },
  { id_rol: 2, nombre_rol: 'Vendedor', descripcion: 'Gestion de ventas y clientes', permisos: ['clientes.ver', 'clientes.crear', 'inventario.ver', 'reportes.ver'] },
  { id_rol: 3, nombre_rol: 'Bodeguero', descripcion: 'Control de inventario y stock', permisos: ['inventario.ver', 'inventario.crear', 'inventario.editar'] },
  { id_rol: 4, nombre_rol: 'Encargado de Compras', descripcion: 'Gestion de proveedores y compras', permisos: ['proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'inventario.ver'] },
  { id_rol: 5, nombre_rol: 'Encargado de RRHH', descripcion: 'Gestion de personal y planilla', permisos: ['personal.ver', 'personal.crear', 'personal.editar', 'reportes.ver'] },
  { id_rol: 6, nombre_rol: 'Gerente', descripcion: 'Acceso a reportes y supervision', permisos: ['inventario.ver', 'clientes.ver', 'proveedores.ver', 'personal.ver', 'reportes.ver', 'reportes.exportar'] },
]

const grupPermisos: Record<string, string[]> = {}
PERMISOS_DISPONIBLES.forEach(p => {
  const modulo = p.split('.')[0]
  if (!grupPermisos[modulo]) grupPermisos[modulo] = []
  grupPermisos[modulo].push(p)
})

const ICONOS: Record<string, string> = { inventario: '📦', clientes: '👥', proveedores: '🚚', personal: '🧑‍💼', ajustes: '⚙️', reportes: '📊' }

export default function RolesTab() {
  const [roles, setRoles] = useState<Rol[]>(ROLES_INICIALES)
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nuevoRol, setNuevoRol] = useState({ nombre_rol: '', descripcion: '' })
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function cargarRoles() {
    setMensaje(null)

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id_rol', { ascending: true })

    if (error) {
      console.error('Error cargando roles:', error)
      setMensaje('No se pudo cargar los roles desde Supabase.')
      return
    }

    if (!data || data.length === 0) {
      setRoles(ROLES_INICIALES)
      return
    }

    setRoles((data as Rol[]).map(r => ({
      id_rol: Number(r.id_rol),
      nombre_rol: r.nombre_rol || '',
      descripcion: r.descripcion || '',
      permisos: Array.isArray(r.permisos) ? r.permisos : [],
    })))
  }

  function seleccionarRol(rol: Rol) {
    setRolSeleccionado(rol)
    setModoEdicion(false)
  }

  async function guardarRol() {
    if (!rolSeleccionado) return

    const { error } = await supabase
      .from('roles')
      .update({
        nombre_rol: rolSeleccionado.nombre_rol,
        descripcion: rolSeleccionado.descripcion,
        permisos: rolSeleccionado.permisos,
      })
      .eq('id_rol', rolSeleccionado.id_rol)

    if (error) {
      alert('Error al guardar rol: ' + error.message)
      return
    }

    setRoles(roles.map(r => r.id_rol === rolSeleccionado.id_rol ? rolSeleccionado : r))
    setModoEdicion(false)
    alert('Rol actualizado.')
  }

  async function crearRol() {
    if (!nuevoRol.nombre_rol.trim()) {
      alert('Ingrese un nombre.')
      return
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([{ nombre_rol: nuevoRol.nombre_rol.trim(), descripcion: nuevoRol.descripcion.trim(), permisos: [] }])
      .select('*')

    if (error) {
      alert('Error al crear rol: ' + error.message)
      return
    }

    const nuevo = (data as Rol[])[0]
    setRoles([...roles, {
      id_rol: Number(nuevo.id_rol),
      nombre_rol: nuevo.nombre_rol,
      descripcion: nuevo.descripcion || '',
      permisos: Array.isArray(nuevo.permisos) ? nuevo.permisos : [],
    }])
    setNuevoRol({ nombre_rol: '', descripcion: '' })
    setMostrarFormulario(false)
    alert('Rol creado.')
  }

  async function eliminarRol(id: number) {
    const rol = roles.find(r => r.id_rol === id)
    if (!rol) return
    if (rol.nombre_rol === 'Administrador') {
      alert('No se puede eliminar el Administrador.')
      return
    }

    if (!confirm('Eliminar este rol?')) return

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id_rol', id)

    if (error) {
      alert('Error al eliminar rol: ' + error.message)
      return
    }

    setRoles(roles.filter(r => r.id_rol !== id))
    if (rolSeleccionado?.id_rol === id) setRolSeleccionado(null)
  }

  function togglePermiso(permiso: string) {
    if (!rolSeleccionado) return
    const permisos = rolSeleccionado.permisos.includes(permiso)
      ? rolSeleccionado.permisos.filter(p => p !== permiso)
      : [...rolSeleccionado.permisos, permiso]
    setRolSeleccionado({ ...rolSeleccionado, permisos })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarRoles()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const rolesFiltrados = roles.filter(r => r.nombre_rol.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ width: '260px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>Roles ({roles.length})</span>
          <button onClick={() => setMostrarFormulario(true)} style={{ padding: '7px 14px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Nuevo</button>
        </div>
        <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' as const }} />
        {mensaje && <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: '#FEF3F2', color: '#B91C1C', fontSize: '13px' }}>{mensaje}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rolesFiltrados.map(rol => (
            <div key={rol.id_rol} onClick={() => seleccionarRol(rol)}
              style={{ padding: '12px 14px', backgroundColor: rolSeleccionado?.id_rol === rol.id_rol ? '#F0FDFA' : '#FFFFFF', border: `1px solid ${rolSeleccionado?.id_rol === rol.id_rol ? '#0F766E' : '#E5E7EB'}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>{rol.nombre_rol}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{rol.permisos.length} permisos</div>
              </div>
              {rol.nombre_rol !== 'Administrador' && (
                <button onClick={e => { e.stopPropagation(); eliminarRol(rol.id_rol) }}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px' }}>
        {!rolSeleccionado && !mostrarFormulario && (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
            <p>Seleccione un rol para ver sus permisos</p>
          </div>
        )}

        {mostrarFormulario && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Crear nuevo rol</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre *</label>
                <input value={nuevoRol.nombre_rol} onChange={e => setNuevoRol({ ...nuevoRol, nombre_rol: e.target.value })} placeholder="Ej: Cajero"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Descripcion</label>
                <input value={nuevoRol.descripcion} onChange={e => setNuevoRol({ ...nuevoRol, descripcion: e.target.value })} placeholder="Descripcion del rol"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={crearRol} style={{ padding: '10px 22px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Crear</button>
                <button onClick={() => setMostrarFormulario(false)} style={{ padding: '10px 22px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {rolSeleccionado && !mostrarFormulario && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '20px' }}>{rolSeleccionado.nombre_rol}</h3>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>{rolSeleccionado.descripcion}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {modoEdicion ? (
                  <>
                    <button onClick={guardarRol} style={{ padding: '9px 20px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Guardar</button>
                    <button onClick={() => { setModoEdicion(false); setRolSeleccionado(roles.find(r => r.id_rol === rolSeleccionado.id_rol)!) }}
                      style={{ padding: '9px 20px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setModoEdicion(true)} style={{ padding: '9px 20px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>✏️ Editar permisos</button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(grupPermisos).map(([modulo, perms]) => (
                <div key={modulo} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '14px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '13px', marginBottom: '10px', textTransform: 'capitalize' as const }}>
                    {ICONOS[modulo]} {modulo}
                  </div>
                  {perms.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: modoEdicion ? 'pointer' : 'default' }}>
                      <input type="checkbox" checked={rolSeleccionado.permisos.includes(p)} onChange={() => modoEdicion && togglePermiso(p)} disabled={!modoEdicion}
                        style={{ cursor: modoEdicion ? 'pointer' : 'default', accentColor: '#0F766E' }} />
                      <span style={{ fontSize: '12px', color: '#4B5563' }}>{p.split('.')[1]}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
