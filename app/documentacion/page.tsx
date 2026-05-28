'use client'

import Link from 'next/link'

const articulos = [
  {
    categoria: 'Inicio',
    titulo: 'Acceso al sistema',
    descripcion: 'El usuario ingresa con su correo y contrasena. Si el usuario esta inactivo o no tiene permisos, el sistema restringe el acceso correspondiente.',
  },
  {
    categoria: 'Ajustes',
    titulo: 'Usuarios del sistema',
    descripcion: 'Desde Ajustes se pueden crear usuarios, asignarles un rol, cambiar su estado, actualizar datos y restablecer contrasenas.',
  },
  {
    categoria: 'Ajustes',
    titulo: 'Roles y permisos',
    descripcion: 'Los roles definen que modulos puede ver un usuario y que acciones puede realizar: ver, crear, editar o eliminar.',
  },
  {
    categoria: 'Inventario',
    titulo: 'Productos y stock',
    descripcion: 'El modulo de Inventario permite registrar productos, consultar existencias, modificar datos y controlar entradas o salidas de stock.',
  },
  {
    categoria: 'Clientes',
    titulo: 'Gestion de clientes',
    descripcion: 'El modulo de Clientes permite registrar clientes, mantener sus datos actualizados y consultar informacion relacionada con facturacion.',
  },
  {
    categoria: 'Proveedores',
    titulo: 'Proveedores y compras',
    descripcion: 'El modulo de Proveedores permite administrar proveedores, generar ordenes de compra y registrar compras recibidas.',
  },
  {
    categoria: 'Personal',
    titulo: 'Empleados y puestos',
    descripcion: 'El modulo de Personal permite registrar empleados, administrar puestos, salarios, vacaciones y reportes internos.',
  },
  {
    categoria: 'Reportes',
    titulo: 'Consulta y salida de informacion',
    descripcion: 'Los reportes ayudan a revisar informacion importante del sistema y, cuando el modulo lo permite, exportar o imprimir datos.',
  },
]

export default function DocumentacionPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'var(--font-geist-sans), Arial, sans-serif', color: '#111827' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>Documentacion</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B7280' }}>Manual de usuario del sistema ERP Ferreteria PROIS.</p>
          </div>
          <Link href="/ajustes" style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#0F766E', textDecoration: 'none', fontWeight: '600' }}>Volver a Ajustes</Link>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6B7280' }}>
          <Link href="/dashboard" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: '600' }}>Dashboard</Link>
          <span>/</span>
          <span>Documentacion</span>
        </div>

        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 16px 40px rgba(15,23,42,0.06)', marginBottom: '24px' }}>
          <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', backgroundColor: '#E0F2F1', color: '#0F766E', fontSize: '12px', fontWeight: 'bold', marginBottom: '14px' }}>Manual de usuario</span>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '26px', color: '#111827' }}>Guia general del ERP</h2>
          <p style={{ margin: 0, maxWidth: '840px', color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
            Este espacio funciona como una documentacion tipo blog para orientar al usuario sobre los modulos principales del sistema, el control de accesos y las tareas comunes de operacion.
          </p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {articulos.map((articulo) => (
            <article key={`${articulo.categoria}-${articulo.titulo}`} style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E5E7EB', padding: '22px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ padding: '5px 9px', borderRadius: '999px', backgroundColor: '#F3F4F6', color: '#475569', fontSize: '11px', fontWeight: 'bold' }}>{articulo.categoria}</span>
              </div>
              <h3 style={{ margin: '0 0 10px 0', color: '#0F172A', fontSize: '18px' }}>{articulo.titulo}</h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.7' }}>{articulo.descripcion}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: '24px', backgroundColor: '#F8FAFC', borderRadius: '18px', border: '1px solid #E5E7EB', padding: '22px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0F172A', fontSize: '18px' }}>Recomendacion para permisos</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.7' }}>
            Cuando se modifique un rol, el usuario afectado debe cerrar sesion e iniciar nuevamente para que el sistema cargue los permisos actualizados.
          </p>
        </section>
      </main>
    </div>
  )
}
