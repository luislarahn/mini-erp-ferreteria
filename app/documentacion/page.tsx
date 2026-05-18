'use client'

import Link from 'next/link'

export default function DocumentacionPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'var(--font-geist-sans), Arial, sans-serif', color: '#111827' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>Documentación</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B7280' }}>Información de uso y referencias para el sistema ERP.</p>
          </div>
          <Link href="/ajustes" style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#0F766E', textDecoration: 'none', fontWeight: '600' }}>Volver a Ajustes</Link>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6B7280' }}>
          <Link href="/dashboard" style={{ color: '#0F766E', textDecoration: 'none' }}>Dashboard</Link>
          <span>›</span>
          <span>Documentación</span>
        </div>

        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 16px 40px rgba(15,23,42,0.06)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '26px', color: '#111827' }}>Guía del sistema ERP</h2>
          <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
            Esta sección presenta los conceptos principales, los módulos disponibles y las acciones más comunes para usar el sistema en una ferretería.
          </p>

          <div style={{ display: 'grid', gap: '18px' }}>
            <article style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>Contenido</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                <li>Usuarios y roles: administrar accesos y permisos.</li>
                <li>Configuración: datos de empresa, moneda, impuesto e inventario.</li>
                <li>Inventario: productos, categorías y stock.</li>
                <li>Clientes y proveedores: registros y gestión de relaciones.</li>
                <li>Reportes: consulta de datos y exportación.</li>
              </ul>
            </article>

            <article style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>Cómo usar este módulo</h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                Navega entre Ajustes, Inventario, Clientes y demás módulos. En Ajustes puedes configurar usuarios, roles y parámetros generales del sistema antes de comenzar a operar.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
