'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type TipoReporte = 'ventas' | 'clientes'

type Factura = {
  id_factura: number
  secuencia_fiscal: string
  nombre_cliente: string
  fecha_factura: string
  subtotal: number
  impuesto_total: number
  total_factura: number
  estado: string
}

type Cliente = {
  id_cliente: number
  nombre_cliente: string
  rtn: string | null
  direccion: string | null
  correo: string | null
  telefono: string | null
  nombre_contacto: string | null
  fecha_registro: string | null
}

function moneda(valor: number | null | undefined) {
  return `L ${(Number(valor) || 0).toFixed(2)}`
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export default function ReportesTab() {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('ventas')

  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (tipoReporte === 'ventas') {
      cargarFacturas()
    } else {
      cargarClientes()
    }
  }, [tipoReporte])

  async function cargarFacturas() {
    setCargando(true)
    setMensaje('')

    try {
      let query = supabase
        .from('facturas')
        .select(
          'id_factura, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado'
        )
        .order('id_factura', { ascending: false })

      if (fechaDesde) {
        query = query.gte('fecha_factura', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('fecha_factura', fechaHasta)
      }

      const { data, error } = await query

      if (error) throw error

      setFacturas(data || [])
    } catch (error: any) {
      console.log('Error al cargar facturas:', error)
      setMensaje(`Error al cargar facturas: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  async function cargarClientes() {
    setCargando(true)
    setMensaje('')

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(
          'id_cliente, nombre_cliente, rtn, direccion, correo, telefono, nombre_contacto, fecha_registro'
        )
        .order('id_cliente', { ascending: false })

      if (error) throw error

      setClientes(data || [])
    } catch (error: any) {
      console.log('Error al cargar clientes:', error)
      setMensaje(`Error al cargar clientes: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  function limpiarFiltroVentas() {
    setFechaDesde('')
    setFechaHasta('')
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busquedaCliente.trim().toLowerCase()

    if (!texto) return clientes

    return clientes.filter((cliente) =>
      cliente.nombre_cliente.toLowerCase().includes(texto)
    )
  }, [clientes, busquedaCliente])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reportes</h2>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-medium">Seleccione un reporte</label>
          <select
            value={tipoReporte}
            onChange={(e) => {
              setTipoReporte(e.target.value as TipoReporte)
              setMensaje('')
            }}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          >
            <option value="ventas">Reporte de Ventas</option>
            <option value="clientes">Reporte de Clientes</option>
          </select>
        </div>
      </div>

      {tipoReporte === 'ventas' && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block mb-1 font-medium">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
              />
            </div>

            <button
              onClick={cargarFacturas}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold"
            >
              Filtrar ventas
            </button>

            <button
              onClick={() => {
                limpiarFiltroVentas()
                setTimeout(() => cargarFacturas(), 0)
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold"
            >
              Mostrar todas
            </button>
          </div>

          <div className="mb-4 text-sm text-slate-300">
            Mostrando {facturas.length} factura(s)
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
              Cargando reporte de ventas...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-3 text-left border border-slate-700">ID</th>
                    <th className="p-3 text-left border border-slate-700">Secuencia Fiscal</th>
                    <th className="p-3 text-left border border-slate-700">Cliente</th>
                    <th className="p-3 text-center border border-slate-700">Fecha</th>
                    <th className="p-3 text-right border border-slate-700">Subtotal</th>
                    <th className="p-3 text-right border border-slate-700">Impuesto</th>
                    <th className="p-3 text-right border border-slate-700">Total</th>
                    <th className="p-3 text-center border border-slate-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center border border-slate-700 bg-slate-900 text-slate-300"
                      >
                        No hay facturas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    facturas.map((factura) => (
                      <tr key={factura.id_factura} className="bg-slate-900 text-white">
                        <td className="p-3 border border-slate-700">{factura.id_factura}</td>
                        <td className="p-3 border border-slate-700">
                          {factura.secuencia_fiscal}
                        </td>
                        <td className="p-3 border border-slate-700">
                          {factura.nombre_cliente}
                        </td>
                        <td className="p-3 border border-slate-700 text-center">
                          {formatearFecha(factura.fecha_factura)}
                        </td>
                        <td className="p-3 border border-slate-700 text-right">
                          {moneda(factura.subtotal)}
                        </td>
                        <td className="p-3 border border-slate-700 text-right">
                          {moneda(factura.impuesto_total)}
                        </td>
                        <td className="p-3 border border-slate-700 text-right">
                          {moneda(factura.total_factura)}
                        </td>
                        <td className="p-3 border border-slate-700 text-center">
                          {factura.estado}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tipoReporte === 'clientes' && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block mb-1 font-medium">Buscar cliente por nombre</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Escriba el nombre del cliente"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
              />
            </div>

            <div className="text-sm text-slate-300">
              Mostrando {clientesFiltrados.length} cliente(s)
            </div>
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
              Cargando reporte de clientes...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-3 text-left border border-slate-700">ID</th>
                    <th className="p-3 text-left border border-slate-700">Nombre</th>
                    <th className="p-3 text-left border border-slate-700">RTN</th>
                    <th className="p-3 text-left border border-slate-700">Dirección</th>
                    <th className="p-3 text-left border border-slate-700">Correo</th>
                    <th className="p-3 text-left border border-slate-700">Teléfono</th>
                    <th className="p-3 text-left border border-slate-700">Contacto</th>
                    <th className="p-3 text-center border border-slate-700">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center border border-slate-700 bg-slate-900 text-slate-300"
                      >
                        No hay clientes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id_cliente} className="bg-slate-900 text-white">
                        <td className="p-3 border border-slate-700">{cliente.id_cliente}</td>
                        <td className="p-3 border border-slate-700">
                          {cliente.nombre_cliente}
                        </td>
                        <td className="p-3 border border-slate-700">{cliente.rtn || '-'}</td>
                        <td className="p-3 border border-slate-700">
                          {cliente.direccion || '-'}
                        </td>
                        <td className="p-3 border border-slate-700">{cliente.correo || '-'}</td>
                        <td className="p-3 border border-slate-700">
                          {cliente.telefono || '-'}
                        </td>
                        <td className="p-3 border border-slate-700">
                          {cliente.nombre_contacto || '-'}
                        </td>
                        <td className="p-3 border border-slate-700 text-center">
                          {formatearFecha(cliente.fecha_registro)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}