
'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type UsuarioLocal = {
  id_usuario?: number
  nombre?: string
  correo?: string
  rol?: string
  permisos?: string[]
}

type UsuarioBD = {
  id_usuario: number
  nombre: string
  correo: string
  rol: string | null
  estado: string | null
  contrasena: string | null
}

export default function PreferenciasPage() {
  const router = useRouter()

  const [idUsuario, setIdUsuario] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | ''>('')

  useEffect(() => {
    cargarUsuario()
  }, [])

  async function cargarUsuario() {
    setCargando(true)
    setMensaje('')
    setTipoMensaje('')

    try {
      const auth = localStorage.getItem('miniERPAuth')
      const usuarioTexto = localStorage.getItem('miniERPUsuario')

      if (auth !== 'true' || !usuarioTexto) {
        router.push('/')
        return
      }

      const usuarioLocal = JSON.parse(usuarioTexto) as UsuarioLocal

      if (!usuarioLocal.id_usuario) {
        setNombre(usuarioLocal.nombre || 'Admin')
        setCorreo(usuarioLocal.correo || '')
        setRol(usuarioLocal.rol || 'Administrador')
        setEstado('Activo')
        setIdUsuario(null)
        setMensaje(
          'Este usuario pertenece al acceso fijo del sistema. Para editar preferencias, ingrese con un usuario creado en Ajustes.'
        )
        setTipoMensaje('error')
        return
      }

      setIdUsuario(usuarioLocal.id_usuario)

      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, correo, rol, estado, contrasena')
        .eq('id_usuario', usuarioLocal.id_usuario)
        .maybeSingle()

      if (error) throw error

      const usuarioBD = data as UsuarioBD | null

      if (!usuarioBD) {
        setMensaje('No se encontró el usuario en la base de datos.')
        setTipoMensaje('error')
        return
      }

      setNombre(usuarioBD.nombre || '')
      setCorreo(usuarioBD.correo || '')
      setRol(usuarioBD.rol || '')
      setEstado(usuarioBD.estado || '')
    } catch (error: any) {
      console.error('Error al cargar preferencias:', error)
      setMensaje(`Error al cargar preferencias: ${error?.message || 'Error inesperado.'}`)
      setTipoMensaje('error')
    } finally {
      setCargando(false)
    }
  }

  async function guardarPreferencias(e: FormEvent) {
    e.preventDefault()
    setMensaje('')
    setTipoMensaje('')

    if (!idUsuario) {
      setMensaje('No se puede actualizar este usuario porque no está vinculado a la tabla usuarios.')
      setTipoMensaje('error')
      return
    }

    if (!nombre.trim()) {
      setMensaje('El nombre de usuario es obligatorio.')
      setTipoMensaje('error')
      return
    }

    if (!correo.trim()) {
      setMensaje('El correo electrónico es obligatorio.')
      setTipoMensaje('error')
      return
    }

    if (nuevaContrasena || confirmarContrasena || contrasenaActual) {
      if (!contrasenaActual) {
        setMensaje('Debe ingresar la contraseña actual para cambiarla.')
        setTipoMensaje('error')
        return
      }

      if (!nuevaContrasena) {
        setMensaje('Debe ingresar la nueva contraseña.')
        setTipoMensaje('error')
        return
      }

      if (nuevaContrasena.length < 4) {
        setMensaje('La nueva contraseña debe tener al menos 4 caracteres.')
        setTipoMensaje('error')
        return
      }

      if (nuevaContrasena !== confirmarContrasena) {
        setMensaje('La confirmación de contraseña no coincide.')
        setTipoMensaje('error')
        return
      }
    }

    setGuardando(true)

    try {
      const { data: usuarioActual, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('id_usuario, correo, contrasena')
        .eq('id_usuario', idUsuario)
        .maybeSingle()

      if (errorUsuario) throw errorUsuario

      const usuario = usuarioActual as UsuarioBD | null

      if (!usuario) {
        setMensaje('No se encontró el usuario para actualizar.')
        setTipoMensaje('error')
        return
      }

      const correoLimpio = correo.trim().toLowerCase()

      if (correoLimpio !== usuario.correo?.toLowerCase()) {
        const { data: correoExistente, error: errorCorreo } = await supabase
          .from('usuarios')
          .select('id_usuario')
          .eq('correo', correoLimpio)
          .neq('id_usuario', idUsuario)
          .limit(1)

        if (errorCorreo) throw errorCorreo

        if (correoExistente && correoExistente.length > 0) {
          setMensaje('Ya existe otro usuario registrado con ese correo electrónico.')
          setTipoMensaje('error')
          return
        }
      }

      const datosActualizar: Record<string, string> = {
        nombre: nombre.trim(),
        correo: correoLimpio,
      }

      if (nuevaContrasena) {
        if (usuario.contrasena !== contrasenaActual) {
          setMensaje('La contraseña actual no es correcta.')
          setTipoMensaje('error')
          return
        }

        datosActualizar.contrasena = nuevaContrasena
      }

      const { error: errorUpdate } = await supabase
        .from('usuarios')
        .update(datosActualizar)
        .eq('id_usuario', idUsuario)

      if (errorUpdate) throw errorUpdate

      const usuarioLocalTexto = localStorage.getItem('miniERPUsuario')
      const usuarioLocal = usuarioLocalTexto
        ? (JSON.parse(usuarioLocalTexto) as UsuarioLocal)
        : {}

      localStorage.setItem(
        'miniERPUsuario',
        JSON.stringify({
          ...usuarioLocal,
          id_usuario: idUsuario,
          nombre: nombre.trim(),
          correo: correoLimpio,
          rol,
        })
      )

      setCorreo(correoLimpio)
      setContrasenaActual('')
      setNuevaContrasena('')
      setConfirmarContrasena('')
      setMensaje('Preferencias actualizadas correctamente.')
      setTipoMensaje('ok')
    } catch (error: any) {
      console.error('Error al guardar preferencias:', error)
      setMensaje(`Error al guardar preferencias: ${error?.message || 'Error inesperado.'}`)
      setTipoMensaje('error')
    } finally {
      setGuardando(false)
    }
  }

  function volverDashboard() {
    router.push('/dashboard')
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-black">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
          Cargando preferencias...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={volverDashboard}
          className="mb-5 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
        >
          ← Volver al dashboard
        </button>

        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-black">Preferencias</h1>

          <p className="mb-6 text-gray-600">
            Gestione los datos básicos de su cuenta de usuario.
          </p>

          {mensaje && (
            <div
              className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                tipoMensaje === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              {mensaje}
            </div>
          )}

          <form onSubmit={guardarPreferencias}>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-black">
                  Nombre de usuario
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                  placeholder="Nombre de usuario"
                  disabled={!idUsuario}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-black">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                  placeholder="correo@ejemplo.com"
                  disabled={!idUsuario}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-black">
                  Rol
                </label>

                <input
                  type="text"
                  value={rol || '-'}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                  disabled
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-black">
                  Estado
                </label>

                <input
                  type="text"
                  value={estado || '-'}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                  disabled
                />
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-300 bg-gray-50 p-5">
              <h2 className="mb-2 text-xl font-bold text-black">
                Cambiar contraseña
              </h2>

              <p className="mb-4 text-sm text-gray-600">
                Complete estos campos únicamente si desea cambiar su contraseña.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block font-medium text-black">
                    Contraseña actual
                  </label>

                  <input
                    type="password"
                    value={contrasenaActual}
                    onChange={(e) => setContrasenaActual(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                    placeholder="Contraseña actual"
                    disabled={!idUsuario}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-black">
                    Nueva contraseña
                  </label>

                  <input
                    type="password"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                    placeholder="Nueva contraseña"
                    disabled={!idUsuario}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-black">
                    Confirmar contraseña
                  </label>

                  <input
                    type="password"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                    placeholder="Confirmar contraseña"
                    disabled={!idUsuario}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guardando || !idUsuario}
                className="rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
