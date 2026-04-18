'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FacturacionTab from '../../components/clientes/FacturacionTab'
import ClientesTab from '../../components/clientes/ClientesTab'
import ReportesTab from '../../components/clientes/ReportesTab'
import ReporteProductos from '../../components/clientes/inventario/ReporteProductos'

type PestanaActiva = 'facturacion' | 'productos' | 'clientes' | 'reportes'

export default function ClientesPage() {
  const router = useRouter()
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('facturacion')
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

  function estiloPestana(activa: boolean) {
    return {
      padding: '11px 18px',
      cursor: 'pointer',
      backgroundColor: activa ? '#0F766E' : '#FFFFFF',
      color: activa ? '#FFFFFF' : '#374151',
      border: `1px solid ${activa ? '#0F766E' : '#E5E7EB'}`,
      borderRadius: '12px',
      fontWeight: 'bold' as const,
      marginRight: '10px',
      boxShadow: activa
        ? '0 8px 18px rgba(15,118,110,0.18)'
        : '0 2px 6px rgba(0,0,0,0.03)',
      fontSize: '14px',
    }
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
        <a
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            color: '#374151',
            textDecoration: 'none',
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          ← Volver al dashboard
        </a>

        <div style={{ marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => setPestanaActiva('facturacion')}
            style={estiloPestana(pestanaActiva === 'facturacion')}
          >
            Facturación
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('productos')}
            style={estiloPestana(pestanaActiva === 'productos')}
          >
            Productos
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('clientes')}
            style={estiloPestana(pestanaActiva === 'clientes')}
          >
            Clientes
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('reportes')}
            style={estiloPestana(pestanaActiva === 'reportes')}
          >
            Reportes
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
          }}
        >
          {pestanaActiva === 'facturacion' && <FacturacionTab />}
          {pestanaActiva === 'productos' && <ReporteProductos />}
          {pestanaActiva === 'clientes' && <ClientesTab />}
          {pestanaActiva === 'reportes' && <ReportesTab />}
        </div>
      </main>
    </div>
  )
}