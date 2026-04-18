'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const modulos = [
  {
    nombre: 'Inventario',
    ruta: '/inventario',
    icono: '📦',
    descripcion: 'Control de productos y stock',
  },
  {
    nombre: 'Clientes',
    ruta: '/clientes',
    icono: '👥',
    descripcion: 'Facturación y gestión de clientes',
  },
  {
    nombre: 'Proveedores',
    ruta: '/proveedores',
    icono: '🚚',
    descripcion: 'Control de proveedores',
  },
  {
    nombre: 'Personal',
    ruta: '/personal',
    icono: '🧑‍💼',
    descripcion: 'Gestión de empleados y puestos',
  },
  {
    nombre: 'Ajustes',
    ruta: '/ajustes',
    icono: '⚙️',
    descripcion: 'Configuración general del sistema',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

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

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        fontFamily: 'Arial, sans-serif',
        color: '#1F2937',
      }}
    >
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '20px 32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#0F172A',
                lineHeight: 1.1,
              }}
            >
              Ferretería PROIS
            </h1>
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '14px',
                color: '#6B7280',
                fontStyle: 'italic',
              }}
            >
              “Todo para construir con confianza.”
            </p>
          </div>

          <div
            ref={menuRef}
            style={{
              position: 'relative',
            }}
          >
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
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                A
              </span>
              Admin
              <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
            </button>

            {menuAbierto && (
              <div
                style={{
                  position: 'absolute',
                  top: '58px',
                  right: 0,
                  width: '220px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  boxShadow: '0 18px 35px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: '#111827',
                      fontSize: '14px',
                    }}
                  >
                    Admin
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '4px',
                    }}
                  >
                    Usuario del sistema
                  </div>
                </div>

                <Link
                  href="/documentacion"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Documentación
                </Link>

                <Link
                  href="/soporte"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Soporte
                </Link>

                <Link
                  href="/preferencias"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Preferencias
                </Link>

                <button
                  onClick={cerrarSesion}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '13px 16px',
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#B91C1C',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '34px 30px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            marginBottom: '28px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '30px',
              color: '#111827',
            }}
          >
            Bienvenido
          </h2>

          <p
            style={{
              marginTop: '12px',
              marginBottom: 0,
              color: '#6B7280',
              fontSize: '15px',
              lineHeight: 1.6,
            }}
          >
           
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 220px))',
            gap: '18px',
            justifyContent: 'start',
          }}
        >
          {modulos.map((modulo) => (
            <Link
              key={modulo.nombre}
              href={modulo.ruta}
              style={{
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '18px',
                  minHeight: '130px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {modulo.icono}
                </div>

                <div>
                  <h3
                    style={{
                      margin: '14px 0 6px 0',
                      fontSize: '16px',
                      color: '#111827',
                    }}
                  >
                    {modulo.nombre}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#6B7280',
                      fontSize: '12px',
                      lineHeight: 1.4,
                    }}
                  >
                    {modulo.descripcion}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}