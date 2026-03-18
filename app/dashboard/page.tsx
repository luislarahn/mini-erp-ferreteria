'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const modulos = [
  { nombre: 'Inventario', ruta: '/inventario', icono: '📦' },
  { nombre: 'Clientes', ruta: '/clientes', icono: '👥' },
  { nombre: 'Proveedores', ruta: '/proveedores', icono: '🚚' },
  { nombre: 'Personal', ruta: '/personal', icono: '🧑‍💼' },
  { nombre: 'Ajustes', ruta: '/ajustes', icono: '⚙️' },
]

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const auth = localStorage.getItem('miniERPAuth')
    if (auth !== 'true') {
      router.push('/')
    }
  }, [router])

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #088395 0%, #0A4D68 45%, #061A40 100%)',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        padding: '30px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '50px',
        }}
      >
        <h1 style={{ fontSize: '28px', color: '#FFFFFF' }}>Mini ERP</h1>

        <button
          onClick={cerrarSesion}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0A4D68',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '24px',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {modulos.map((modulo) => (
          <Link
            key={modulo.nombre}
            href={modulo.ruta}
            style={{
              textDecoration: 'none',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                background: '#0A4D68',
                border: '1px solid #088395',
                borderRadius: '18px',
                padding: '24px',
                textAlign: 'center',
                backdropFilter: 'blur(6px)',
                cursor: 'pointer',
                transition: '0.2s',
                boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>
                {modulo.icono}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              >
                {modulo.nombre}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}