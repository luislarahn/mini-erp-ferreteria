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
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Reportes</h2>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium text-black">Seleccione un reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => {
                setTipoReporte(e.target.value as TipoReporte)
                setMensaje('')
              }}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
            >
              <option value="ventas">Reporte de Ventas</option>
              <option value="clientes">Reporte de Clientes</option>
            </select>
          </div>
        </div>
      </div>

      {tipoReporte === 'ventas' && (
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block mb-1 font-medium text-black">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <button
              onClick={cargarFacturas}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Filtrar ventas
            </button>

            <button
              onClick={() => {
                limpiarFiltroVentas()
                setTimeout(() => cargarFacturas(), 0)
              }}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
            >
              Mostrar todas
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {facturas.length} factura(s)
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-gray-300 bg-white p-6 text-black">
              Cargando reporte de ventas...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-black">
                  <tr>
                    <th className="p-3 text-left border border-gray-200">ID</th>
                    <th className="p-3 text-left border border-gray-200">Secuencia Fiscal</th>
                    <th className="p-3 text-left border border-gray-200">Cliente</th>
                    <th className="p-3 text-center border border-gray-200">Fecha</th>
                    <th className="p-3 text-right border border-gray-200">Subtotal</th>
                    <th className="p-3 text-right border border-gray-200">Impuesto</th>
                    <th className="p-3 text-right border border-gray-200">Total</th>
                    <th className="p-3 text-center border border-gray-200">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay facturas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    facturas.map((factura) => (
                      <tr key={factura.id_factura} className="bg-white text-black">
                        <td className="p-3 border border-gray-200">{factura.id_factura}</td>
                        <td className="p-3 border border-gray-200">
                          {factura.secuencia_fiscal}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {factura.nombre_cliente}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {formatearFecha(factura.fecha_factura)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(factura.subtotal)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(factura.impuesto_total)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(factura.total_factura)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
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
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block mb-1 font-medium text-black">Buscar cliente por nombre</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Escriba el nombre del cliente"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {clientesFiltrados.length} cliente(s)
            </div>
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-gray-300 bg-white p-6 text-black">
              Cargando reporte de clientes...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-black">
                  <tr>
                    <th className="p-3 text-left border border-gray-200">ID</th>
                    <th className="p-3 text-left border border-gray-200">Nombre</th>
                    <th className="p-3 text-left border border-gray-200">RTN</th>
                    <th className="p-3 text-left border border-gray-200">Dirección</th>
                    <th className="p-3 text-left border border-gray-200">Correo</th>
                    <th className="p-3 text-left border border-gray-200">Teléfono</th>
                    <th className="p-3 text-left border border-gray-200">Contacto</th>
                    <th className="p-3 text-center border border-gray-200">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay clientes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id_cliente} className="bg-white text-black">
                        <td className="p-3 border border-gray-200">{cliente.id_cliente}</td>
                        <td className="p-3 border border-gray-200">
                          {cliente.nombre_cliente}
                        </td>
                        <td className="p-3 border border-gray-200">{cliente.rtn || '-'}</td>
                        <td className="p-3 border border-gray-200">
                          {cliente.direccion || '-'}
                        </td>
                        <td className="p-3 border border-gray-200">{cliente.correo || '-'}</td>
                        <td className="p-3 border border-gray-200">
                          {cliente.telefono || '-'}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {cliente.nombre_contacto || '-'}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
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