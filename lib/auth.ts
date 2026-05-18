export type UsuarioSesion = {
  id_usuario?: number
  nombre?: string
  correo?: string
  rol?: string
  permisos?: string[]
}

export const PERMISOS_POR_ROL: Record<string, string[]> = {
  administrador: [
    'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
    'clientes.ver', 'clientes.crear', 'clientes.editar',
    'proveedores.ver', 'proveedores.crear', 'proveedores.editar',
    'personal.ver', 'personal.crear', 'personal.editar',
    'ajustes.ver', 'ajustes.editar',
    'reportes.ver', 'reportes.exportar',
  ],
  vendedor: ['clientes.ver', 'clientes.crear', 'inventario.ver', 'reportes.ver'],
  bodeguero: ['inventario.ver', 'inventario.crear', 'inventario.editar'],
  'encargado de compras': ['proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'inventario.ver'],
  'encargado de rrhh': ['personal.ver', 'personal.crear', 'personal.editar', 'reportes.ver'],
  gerente: ['inventario.ver', 'clientes.ver', 'proveedores.ver', 'personal.ver', 'reportes.ver', 'reportes.exportar'],
}

export function obtenerUsuarioSesion(): UsuarioSesion | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem('miniERPUsuario')
  if (!raw) return null

  try {
    return JSON.parse(raw) as UsuarioSesion
  } catch {
    return null
  }
}

export function nombreUsuario(usuario: UsuarioSesion | null) {
  return usuario?.nombre?.trim() || usuario?.correo?.split('@')[0] || 'Usuario'
}

export function inicialUsuario(usuario: UsuarioSesion | null) {
  return nombreUsuario(usuario).charAt(0).toUpperCase()
}

export function permisosUsuario(usuario: UsuarioSesion | null) {
  const rol = usuario?.rol?.toLowerCase().trim()
  return usuario?.permisos?.length ? usuario.permisos : PERMISOS_POR_ROL[rol ?? ''] ?? []
}

export function tienePermiso(usuario: UsuarioSesion | null, permiso: string) {
  return permisosUsuario(usuario).includes(permiso)
}

export function puedeEntrarModulo(usuario: UsuarioSesion | null, modulo: string) {
  return tienePermiso(usuario, `${modulo}.ver`)
}

export function puedeEntrarAjustes(usuario: UsuarioSesion | null) {
  return puedeEntrarModulo(usuario, 'ajustes')
}
