 'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Usuario = {
  id_usuario: number
  nombre: string
  correo: string
  rol: string
  estado: 'Activo' | 'Inactivo'
  ultima_sesion: string | null
  contrasena?: string
  password?: string
}

const AVATAR_COLORS = ['#0F766E', '#1D4ED8', '#7C3AED', '#B45309', '#BE185D', '#065F46']

function getColor(nombre: string) {
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ nombre: '', correo: '', rol: 'Vendedor', estado: 'Activo' as 'Activo' | 'Inactivo', contrasena: '' })
  const [rolesSistema, setRolesSistema] = useState<string[]>(['Administrador', 'Vendedor', 'Bodeguero', 'Encargado de Compras', 'Encargado de RRHH', 'Gerente'])
  const [mostrarResetPass, setMostrarResetPass] = useState<number | null>(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function cargarRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('nombre_rol')
      .order('id_rol', { ascending: true })

    if (error || !data || data.length === 0) return

    setRolesSistema(data.map((r: { nombre_rol: string }) => r.nombre_rol).filter(Boolean))
  }

  async function cargarUsuarios() {
    setCargando(true)
    setMensaje(null)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id_usuario', { ascending: false })

    setCargando(false)

    if (error) {
      console.error('Error cargando usuarios:', error)
      setMensaje('No se pudo cargar los usuarios. Revisa la conexión con Supabase.')
      return
    }

    if (!data || data.length === 0) {
      setUsuarios([])
      return
    }

    setUsuarios((data as Usuario[]).map(u => ({
      id_usuario: Number(u.id_usuario),
      nombre: u.nombre || '',
      correo: u.correo || '',
      rol: u.rol || 'Vendedor',
      estado: u.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
      ultima_sesion: u.ultima_sesion ?? null,
      contrasena: u.contrasena,
      password: u.password,
    })))
  }

  async function guardarUsuario() {
    if (!form.nombre.trim() || !form.correo.trim()) {
      alert('Complete todos los campos requeridos.')
      return
    }

    if (!form.correo.includes('@')) {
      alert('Ingrese un correo valido.')
      return
    }

    if (!usuarioEditando && form.contrasena.length < 6) {
      alert('Ingrese una contraseña de minimo 6 caracteres.')
      return
    }

    const payload = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim().toLowerCase(),
      rol: form.rol,
      estado: form.estado,
      ultima_sesion: usuarioEditando?.ultima_sesion ?? null,
      ...(form.contrasena ? { contrasena: form.contrasena } : {}),
    }

    if (usuarioEditando) {
      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id_usuario', usuarioEditando.id_usuario)

      if (error) {
        alert('Error al actualizar usuario: ' + error.message)
        return
      }

      await cargarUsuarios()
      setMostrarModal(false)
      return
    }

    const { error } = await supabase
      .from('usuarios')
      .insert([payload])

    if (error) {
      alert('Error al crear usuario: ' + error.message)
      return
    }

    await cargarUsuarios()
    setMostrarModal(false)
  }

  async function toggleEstado(id: number) {
    const usuario = usuarios.find(u => u.id_usuario === id)
    if (!usuario) return

    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo'
    const { error } = await supabase
      .from('usuarios')
      .update({ estado: nuevoEstado })
      .eq('id_usuario', id)

    if (error) {
      alert('Error al actualizar estado: ' + error.message)
      return
    }

    setUsuarios(usuarios.map(u => u.id_usuario === id ? { ...u, estado: nuevoEstado } : u))
  }

  async function eliminarUsuario(id: number) {
    const usuario = usuarios.find(u => u.id_usuario === id)
    if (!usuario) return

    if (usuario.rol === 'Administrador') {
      const totalAdministradores = usuarios.filter(u => u.rol === 'Administrador').length
      if (totalAdministradores <= 1) {
        alert('No se puede eliminar el único Administrador.')
        return
      }
    }

    if (!confirm('Eliminar este usuario?')) return

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id_usuario', id)

    if (error) {
      alert('Error al eliminar usuario: ' + error.message)
      return
    }

    setUsuarios(usuarios.filter(u => u.id_usuario !== id))
    if (usuarioEditando?.id_usuario === id) {
      setUsuarioEditando(null)
      setMostrarModal(false)
    }
  }

  function abrirCrear() {
    setUsuarioEditando(null)
    setForm({ nombre: '', correo: '', rol: rolesSistema.includes('Vendedor') ? 'Vendedor' : rolesSistema[0] ?? 'Vendedor', estado: 'Activo', contrasena: '' })
    setMostrarModal(true)
  }

  function abrirEditar(u: Usuario) {
    setUsuarioEditando(u)
    setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol, estado: u.estado, contrasena: '' })
    setMostrarModal(true)
  }

  async function resetearPassword(id: number) {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      alert('Minimo 6 caracteres.')
      return
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ contrasena: nuevaPassword })
      .eq('id_usuario', id)

    if (error) {
      alert('Error al actualizar contraseña: ' + error.message)
      return
    }

    alert('Contrasena actualizada.')
    setMostrarResetPass(null)
    setNuevaPassword('')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarUsuarios()
      void cargarRoles()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'Todos' || u.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const activos = usuarios.filter(u => u.estado === 'Activo').length

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        {[
          {
            label: 'Total usuarios', valor: usuarios.length, color: '#0F766E', bg: '#F0FDFA'
          }, {
            label: 'Activos', valor: activos, color: '#16A34A', bg: '#F0FDF4'
          }, {
            label: 'Inactivos', valor: usuarios.length - activos, color: '#DC2626', bg: '#FEF2F2'
          }
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, border: `1px solid ${s.color}33`, borderRadius: '12px', padding: '14px 20px', flex: 1 }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color }}>{s.valor}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {mensaje && <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '14px', backgroundColor: '#FEF3F2', color: '#B91C1C' }}>{mensaje}</div>}

      {/* Barra herramientas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Buscar usuario o correo..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px' }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as 'Todos' | 'Activo' | 'Inactivo')}
          style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', backgroundColor: '#FFFFFF' }}>
          <option value="Todos">Todos</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>
        <button onClick={abrirCrear} style={{ padding: '10px 20px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          + Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Usuario', 'Correo', 'Rol', 'Estado', 'Ultima sesion', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>{cargando ? 'Cargando usuarios...' : 'No se encontraron usuarios'}</td></tr>
            )}
            {usuariosFiltrados.map((u, idx) => (
              <tr key={u.id_usuario} style={{ borderBottom: idx < usuariosFiltrados.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getColor(u.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{u.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4B5563' }}>{u.correo}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{u.rol}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', backgroundColor: u.estado === 'Activo' ? '#F0FDF4' : '#FEF2F2', color: u.estado === 'Activo' ? '#16A34A' : '#DC2626', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{u.estado}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>{u.ultima_sesion ?? 'Nunca'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => abrirEditar(u)} style={{ padding: '5px 10px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                    <button onClick={() => toggleEstado(u.id_usuario)} style={{ padding: '5px 10px', backgroundColor: u.estado === 'Activo' ? '#FEF9C3' : '#F0FDF4', color: u.estado === 'Activo' ? '#92400E' : '#16A34A', border: '1px solid #E5E7EB', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>
                      {u.estado === 'Activo' ? '⏸️' : '▶️'}
                    </button>
                    <button onClick={() => { setMostrarResetPass(u.id_usuario); setNuevaPassword('') }} style={{ padding: '5px 10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>🔑</button>
                    <button onClick={() => eliminarUsuario(u.id_usuario)} style={{ padding: '5px 10px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                  </div>
                  {mostrarResetPass === u.id_usuario && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="password" placeholder="Nueva contrasena" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '12px', width: '140px' }} />
                      <button onClick={() => resetearPassword(u.id_usuario)} style={{ padding: '6px 10px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                      <button onClick={() => setMostrarResetPass(null)} style={{ padding: '6px 10px', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '32px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#111827', fontSize: '18px' }}>{usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre completo *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Perez"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Correo electronico *</label>
                <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="correo@empresa.com"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  {usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                </label>
                <input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} placeholder="Minimo 6 caracteres"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', backgroundColor: '#FFFFFF' }}>
                  {rolesSistema.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as 'Activo' | 'Inactivo' })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', backgroundColor: '#FFFFFF' }}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={guardarUsuario} style={{ flex: 1, padding: '12px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                {usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
              <button onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
