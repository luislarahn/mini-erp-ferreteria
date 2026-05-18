'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RolesTab from '../../components/ajustes/RolesTab'
import UsuariosTab from '../../components/ajustes/UsuariosTab'
import ConfiguracionTab from '../../components/ajustes/ConfiguracionTab'
import { inicialUsuario, nombreUsuario, obtenerUsuarioSesion, puedeEntrarAjustes, type UsuarioSesion } from '../../lib/auth'

type PestanaActiva = 'usuarios' | 'roles' | 'configuracion'

export default function AjustesPage() {
  const router = useRouter()
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('usuarios')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(null)
  const [autorizado, setAutorizado] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const auth = localStorage.getItem('miniERPAuth')
      const usuario = obtenerUsuarioSesion()

      if (auth !== 'true') {
        router.push('/')
        return
      }

      if (!puedeEntrarAjustes(usuario)) {
      alert('No tienes permiso para ingresar al módulo de Ajustes.')
        router.push('/dashboard')
        return
      }

      setUsuarioActual(usuario)
      setAutorizado(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [router])

  useEffect(() => {
    function manejarClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', manejarClickFuera)
    return () => document.removeEventListener('mousedown', manejarClickFuera)
  }, [])

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    localStorage.removeItem('miniERPUsuario')
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
      boxShadow: activa ? '0 8px 18px rgba(15,118,110,0.18)' : '0 2px 6px rgba(0,0,0,0.03)',
      fontSize: '14px',
    }
  }

  const pestanas: { key: PestanaActiva; label: string; icono: string }[] = [
    { key: 'usuarios', label: 'Usuarios del sistema', icono: '👤' },
    { key: 'roles', label: 'Roles y permisos', icono: '🔐' },
    { key: 'configuracion', label: 'Configuracion', icono: '⚙️' },
  ]

  if (!autorizado) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Arial, sans-serif', color: '#1F2937' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A', lineHeight: 1.1 }}>Ferreteria PROIS</h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>&quot;Todo para construir con confianza.&quot;</p>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#111827', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 8px 18px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>{inicialUsuario(usuarioActual)}</span>
              {nombreUsuario(usuarioActual)}
              <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
            </button>
            {menuAbierto && (
              <div style={{ position: 'absolute', top: '58px', right: 0, width: '220px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 18px 35px rgba(0,0,0,0.10)', overflow: 'hidden', zIndex: 1000 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA' }}>
                  <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{nombreUsuario(usuarioActual)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{usuarioActual?.rol ?? 'Usuario del sistema'}</div>
                </div>
                <Link href="/documentacion" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151', fontSize: '14px', borderBottom: '1px solid #F3F4F6' }} onClick={() => setMenuAbierto(false)}>Documentación</Link>
                <Link href="/soporte" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151', fontSize: '14px', borderBottom: '1px solid #F3F4F6' }} onClick={() => setMenuAbierto(false)}>Soporte</Link>
                <button onClick={cerrarSesion} style={{ width: '100%', textAlign: 'left', padding: '13px 16px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: '14px', fontWeight: 'bold' }}>Cerrar sesion</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px' }}>
          <Link href="/dashboard" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: '600' }}>Dashboard</Link>
          <span style={{ color: '#9CA3AF' }}>›</span>
          <span style={{ color: '#6B7280' }}>Ajustes</span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#111827', fontWeight: 'bold' }}>⚙️ Modulo de Ajustes</h2>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>Gestion de usuarios, roles y configuracion general del sistema</p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {pestanas.map(p => (
            <button key={p.key} onClick={() => setPestanaActiva(p.key)} style={estiloPestana(pestanaActiva === p.key)}>
              {p.icono} {p.label}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#F9FAFB', borderRadius: '20px', padding: '24px', border: '1px solid #E5E7EB' }}>
          {pestanaActiva === 'usuarios' && <UsuariosTab />}
          {pestanaActiva === 'roles' && <RolesTab />}
          {pestanaActiva === 'configuracion' && <ConfiguracionTab />}
        </div>
      </main>
    </div>
  )
}
