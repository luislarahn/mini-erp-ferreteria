'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type UsuarioLogin = {
  id_usuario?: number
  nombre?: string
  correo?: string
  rol?: string
  estado?: string
  contrasena?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(e: FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const correoLimpio = correo.trim().toLowerCase()

    if (correoLimpio === 'admin@proyecto.com' && password === 'admin1986') {
      localStorage.setItem('miniERPAuth', 'true')
      localStorage.setItem('miniERPUsuario', JSON.stringify({
        nombre: 'Admin',
        correo: correoLimpio,
        rol: 'Administrador',
      }))
      router.push('/dashboard')
      return
    }

    try {
      const { data, error: errorConsulta } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correoLimpio)
        .maybeSingle()

      if (errorConsulta) throw errorConsulta

      const usuario = data as UsuarioLogin | null
      const contrasenaGuardada = usuario?.contrasena ?? usuario?.password

      if (!usuario || usuario.estado === 'Inactivo' || contrasenaGuardada !== password) {
        setError('Credenciales incorrectas o usuario inactivo')
        setCargando(false)
        return
      }

      await supabase
        .from('usuarios')
        .update({ ultima_sesion: new Date().toISOString() })
        .eq('id_usuario', usuario.id_usuario)

      localStorage.setItem('miniERPAuth', 'true')
      localStorage.setItem('miniERPUsuario', JSON.stringify({
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      }))
      router.push('/dashboard')
    } catch (err) {
      console.error('Error iniciando sesion:', err)

      setError('No se pudo validar el usuario en Supabase')
      setCargando(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #061A40 0%, #0A4D68 55%, #088395 100%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '10px',
            color: '#0A4D68',
            fontSize: '30px',
          }}
        >
          Ferretería PROIS
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#3A4A5A',
            marginBottom: '24px',
          }}
        >
          Iniciar sesión
        </p>

        <form onSubmit={iniciarSesion}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ color: '#3A4A5A' }}>Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@admin.com"
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '6px',
                borderRadius: '8px',
                border: '1px solid #BFC7D1',
                color: '#000000',
                backgroundColor: '#FFFFFF',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ color: '#3A4A5A' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '6px',
                borderRadius: '8px',
                border: '1px solid #BFC7D1',
                color: '#000000',
                backgroundColor: '#FFFFFF',
                outline: 'none',
              }}
              required
            />
          </div>

          {error && (
            <p style={{ color: '#C62828', marginBottom: '12px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0A4D68',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: cargando ? 0.75 : 1,
            }}
          >
            {cargando ? 'Validando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p
          style={{
            marginTop: '18px',
            textAlign: 'center',
            color: '#3A4A5A',
            fontSize: '14px',
          }}
        >
          
        </p>
      </div>
    </div>
  )
}
