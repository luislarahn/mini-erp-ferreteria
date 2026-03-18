'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function iniciarSesion(e: FormEvent) {
    e.preventDefault()

    if (correo === 'admin@admin.com' && password === 'admin') {
      localStorage.setItem('miniERPAuth', 'true')
      router.push('/dashboard')
    } else {
      setError('Credenciales incorrectas')
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
          Mini ERP
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
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0A4D68',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Iniciar sesión
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
          Usuario de prueba: admin@admin.com / admin
        </p>
      </div>
    </div>
  )
}