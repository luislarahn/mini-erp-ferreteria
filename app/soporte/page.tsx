'use client'

import Link from 'next/link'

const articulosAyuda = [
  {
    titulo: 'Crear usuarios',
    texto: 'Desde Ajustes, abre Usuarios del sistema, registra nombre, correo, rol, estado y una contraseña inicial.',
  },
  {
    titulo: 'Asignar permisos',
    texto: 'En Roles y permisos selecciona un rol, presiona Editar permisos y marca las acciones que puede usar.',
  },
  {
    titulo: 'Problemas de acceso',
    texto: 'Verifica que el usuario esté Activo y usa la acción de llave en Usuarios para cambiar la contraseña.',
  },
]

export default function SoportePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'var(--font-geist-sans), Arial, sans-serif', color: '#111827' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>Soporte</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B7280' }}>Información de contacto y ayuda para el usuario.</p>
          </div>
          <Link href="/ajustes" style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#0F766E', textDecoration: 'none', fontWeight: '600' }}>Volver a Ajustes</Link>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6B7280' }}>
          <Link href="/dashboard" style={{ color: '#0F766E', textDecoration: 'none' }}>Dashboard</Link>
          <span>›</span>
          <span>Soporte</span>
        </div>

        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 16px 40px rgba(15,23,42,0.06)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '26px', color: '#111827' }}>Centro de ayuda</h2>
          <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
            Artículos cortos para resolver dudas comunes del ERP y datos de contacto para reportar incidencias.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            {articulosAyuda.map(articulo => (
              <article key={articulo.titulo} style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '22px', border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>{articulo.titulo}</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>{articulo.texto}</p>
              </article>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <article style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>Contacto</h3>
              <div style={{ display: 'grid', gap: '12px', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                <div><strong>Email:</strong> <a href="mailto:soporte@ferreteriais.com" style={{ color: '#0F766E', textDecoration: 'none' }}>soporte@ferreteriais.com</a></div>
                <div><strong>Teléfono:</strong> <a href="tel:+50489356520" style={{ color: '#0F766E', textDecoration: 'none' }}>+504 8935-6520</a></div>
                <div><strong>Horario:</strong> Lunes a viernes, 8:00 a 17:00</div>
              </div>
            </article>

            <article style={{ backgroundColor: '#F8FAFC', borderRadius: '20px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>Cómo reportar un problema</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                <li>Describe el error o comportamiento inesperado.</li>
                <li>Indica el módulo donde ocurre.</li>
                <li>Agrega pasos para reproducirlo.</li>
                <li>Incluye captura de pantalla si puedes.</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
