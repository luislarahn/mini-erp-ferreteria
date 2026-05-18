'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Configuracion = {
  id: number
  razon_social: string
  nombre_comercial: string
  rtn: string
  direccion: string
  telefono: string
  correo: string
}

const CONFIG_INICIAL: Configuracion = {
  id: 1,
  razon_social: 'Ferretería IS S.A.',
  nombre_comercial: 'Ferretería IS',
  rtn: '0801199902399',
  direccion: 'Tegucigalpa, M.D.C., Honduras',
  telefono: '+504 9999-9999',
  correo: 'contacto@ferreteriais.com',
}

type Categoria = {
  id_categoria: number
  nombre: string
  activa: boolean
}

type CategoriaSupabase = Partial<Categoria>

export default function ConfiguracionTab() {
  const [config, setConfig] = useState<Configuracion>(CONFIG_INICIAL)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nuevaCat, setNuevaCat] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function cargarConfiguracion() {
    setCargando(true)

    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      setCargando(false)

      if (error) {
        console.error('Error cargando configuracion:', JSON.stringify(error))
        setMensaje('No se pudo cargar la configuración desde Supabase.')
        return
      }

      if (!data) {
        setConfig(CONFIG_INICIAL)
        return
      }

      setConfig({
        id: Number(data.id ?? 1),
        razon_social: String(data.razon_social ?? ''),
        nombre_comercial: String(data.nombre_comercial ?? ''),
        rtn: String(data.rtn ?? ''),
        direccion: String(data.direccion ?? ''),
        telefono: String(data.telefono ?? ''),
        correo: String(data.correo ?? ''),
      })
    } catch (err: unknown) {
      setCargando(false)
      console.error('Exception cargando configuracion:', err)
      setMensaje(err instanceof Error ? err.message : 'Error desconocido al cargar configuración.')
    }
  }

  async function guardarConfiguracion() {
    setMensaje('Guardando...')

    const payload = {
      id: 1,
      razon_social: config.razon_social,
      nombre_comercial: config.nombre_comercial,
      rtn: config.rtn,
      direccion: config.direccion,
      telefono: config.telefono,
      correo: config.correo,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('configuracion')
      .upsert([payload], { onConflict: 'id' })

    if (error) {
      console.error('Error guardando configuracion:', error)
      setMensaje('Error al guardar configuración: ' + error.message)
      return
    }

    setMensaje('Guardado con éxito')
    setTimeout(() => setMensaje(null), 1600)
  }

  async function cargarCategorias() {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('id_categoria', { ascending: true })

      if (error) {
        console.error('Error cargando categorias:', JSON.stringify(error))
        setCategorias([])
        return
      }

      setCategorias(
        ((data || []) as CategoriaSupabase[]).map((c) => ({
          id_categoria: Number(c.id_categoria),
          nombre: String(c.nombre ?? ''),
          activa: c.activa === false ? false : true,
        }))
      )
    } catch (err: unknown) {
      console.error('Exception cargando categorias:', err)
      setCategorias([])
    }
  }

  async function agregarCategoria() {
    if (!nuevaCat.trim()) {
      alert('Ingrese el nombre de la categoria')
      return
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nombre: nuevaCat.trim(), activa: true }])
      .select('*')

    if (error) {
      alert('Error al crear categoria: ' + error.message)
      return
    }

    const nuevo = data?.[0]

    if (nuevo) {
      setCategorias([
        ...categorias,
        {
          id_categoria: Number(nuevo.id_categoria),
          nombre: String(nuevo.nombre ?? ''),
          activa: nuevo.activa === false ? false : true,
        },
      ])
    }

    setNuevaCat('')
  }

  async function toggleCategoria(id: number) {
    const cat = categorias.find(c => c.id_categoria === id)
    if (!cat) return

    const { error } = await supabase
      .from('categorias')
      .update({ activa: !cat.activa })
      .eq('id_categoria', id)

    if (error) {
      alert('Error al actualizar categoria: ' + error.message)
      return
    }

    setCategorias(
      categorias.map(c =>
        c.id_categoria === id ? { ...c, activa: !c.activa } : c
      )
    )
  }

  async function eliminarCategoria(id: number) {
    if (!confirm('Eliminar categoria?')) return

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id_categoria', id)

    if (error) {
      alert('Error al eliminar categoria: ' + error.message)
      return
    }

    setCategorias(categorias.filter(c => c.id_categoria !== id))
  }

  function cambiarCampo(campo: keyof Configuracion, valor: string) {
    setConfig({
      ...config,
      [campo]: valor,
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarConfiguracion()
      void cargarCategorias()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: 0, color: '#111827' }}>Datos de la empresa</h3>

        {cargando && (
          <div
            style={{
              marginTop: '12px',
              color: '#374151',
              backgroundColor: '#F3F4F6',
              padding: '10px 12px',
              borderRadius: '10px',
            }}
          >
            Cargando configuración...
          </div>
        )}

        <div style={{ marginTop: '14px', display: 'grid', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Razón social</label>
            <input
              value={config.razon_social ?? ''}
              onChange={(e) => cambiarCampo('razon_social', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Nombre comercial</label>
            <input
              value={config.nombre_comercial ?? ''}
              onChange={(e) => cambiarCampo('nombre_comercial', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>RTN</label>
            <input
              value={config.rtn ?? ''}
              onChange={(e) => cambiarCampo('rtn', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Dirección</label>
            <input
              value={config.direccion ?? ''}
              onChange={(e) => cambiarCampo('direccion', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Teléfono</label>
            <input
              value={config.telefono ?? ''}
              onChange={(e) => cambiarCampo('telefono', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Correo</label>
            <input
              value={config.correo ?? ''}
              onChange={(e) => cambiarCampo('correo', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', gap: '10px' }}>
          <button
            onClick={guardarConfiguracion}
            style={{
              padding: '10px 18px',
              backgroundColor: '#0F766E',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Guardar
          </button>

          <button
            onClick={() => setConfig(CONFIG_INICIAL)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Restablecer
          </button>
        </div>

        {mensaje && (
          <div
            style={{
              marginTop: '12px',
              color: '#065F46',
              backgroundColor: '#ECFDF5',
              padding: '10px 12px',
              borderRadius: '10px',
            }}
          >
            {mensaje}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: 0, color: '#111827' }}>Categorias</h3>

        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={nuevaCat}
              onChange={e => setNuevaCat(e.target.value)}
              placeholder="Nueva categoria"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
              }}
            />

            <button
              onClick={agregarCategoria}
              style={{
                padding: '10px 14px',
                backgroundColor: '#0F766E',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Añadir
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categorias.map(c => (
              <div
                key={c.id_categoria}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#FAFAFB',
                  border: '1px solid #F3F4F6',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleCategoria(c.id_categoria)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: c.activa ? '#FEF9C3' : '#F3F4F6',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    {c.activa ? 'Desactivar' : 'Activar'}
                  </button>

                  <button
                    onClick={() => eliminarCategoria(c.id_categoria)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '8px',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {categorias.length === 0 && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#FAFAFB',
                  border: '1px solid #F3F4F6',
                  color: '#6B7280',
                  fontSize: '14px',
                }}
              >
                No hay categorías registradas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  color: '#374151',
  marginBottom: '6px',
  fontWeight: 'bold',
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '10px',
  fontSize: '14px',
}
