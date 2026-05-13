'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type TipoReporte = 'ventas' | 'clientes' | 'recibos' | 'notasCredito'

type Factura = {
  id_factura: number
  id_cliente: number | null
  secuencia_fiscal: string
  nombre_cliente: string
  fecha_factura: string
  subtotal: number
  impuesto_total: number
  total_factura: number
  estado: string
}

type Recibo = {
  id_recibo: number
  id_cliente: number | null
  secuencia_recibo: string
  nombre_cliente: string
  fecha_recibo: string
  descripcion: string
  valor_recibido: number
  estado: string
}

type NotaCredito = {
  id_nota_credito: number
  id_cliente: number | null
  secuencia_fiscal: string
  nombre_cliente: string
  fecha_nota: string
  descripcion: string
  valor_nota: number
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

type ClienteConVentas = Cliente & {
  cantidad_facturas: number
  subtotal_facturado: number
  impuesto_facturado: number
  total_facturado: number
  ultima_factura: string | null
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

function normalizarTexto(texto: string | null | undefined) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function abrirFactura(idFactura: number) {
  window.open(`/clientes/factura/${idFactura}`, '_blank')
}

function abrirRecibo(idRecibo: number) {
  window.open(`/clientes/recibo/${idRecibo}`, '_blank')
}

function abrirNotaCredito(idNotaCredito: number) {
  window.open(`/clientes/nota-credito/${idNotaCredito}`, '_blank')
}

export default function ReportesTab() {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('ventas')

  const [facturas, setFacturas] = useState<Factura[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [facturasClientes, setFacturasClientes] = useState<Factura[]>([])

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busquedaVentas, setBusquedaVentas] = useState('')
  const [busquedaRecibos, setBusquedaRecibos] = useState('')
  const [busquedaNotasCredito, setBusquedaNotasCredito] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (tipoReporte === 'ventas') {
      cargarFacturas()
    } else if (tipoReporte === 'clientes') {
      cargarReporteClientes()
    } else if (tipoReporte === 'recibos') {
      cargarRecibos()
    } else {
      cargarNotasCredito()
    }
  }, [tipoReporte])

  async function cargarFacturas() {
    setCargando(true)
    setMensaje('')

    try {
      let query = supabase
        .from('facturas')
        .select(
          'id_factura, id_cliente, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado'
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

  async function cargarRecibos() {
    setCargando(true)
    setMensaje('')

    try {
      let query = supabase
        .from('recibos_pago')
        .select(
          'id_recibo, id_cliente, secuencia_recibo, nombre_cliente, fecha_recibo, descripcion, valor_recibido, estado'
        )
        .order('id_recibo', { ascending: false })

      if (fechaDesde) {
        query = query.gte('fecha_recibo', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('fecha_recibo', fechaHasta)
      }

      const { data, error } = await query

      if (error) throw error

      setRecibos(data || [])
    } catch (error: any) {
      console.log('Error al cargar recibos:', error)
      setMensaje(`Error al cargar recibos: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  async function cargarNotasCredito() {
    setCargando(true)
    setMensaje('')

    try {
      let query = supabase
        .from('notas_credito')
        .select(
          'id_nota_credito, id_cliente, secuencia_fiscal, nombre_cliente, fecha_nota, descripcion, valor_nota, estado'
        )
        .order('id_nota_credito', { ascending: false })

      if (fechaDesde) {
        query = query.gte('fecha_nota', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('fecha_nota', fechaHasta)
      }

      const { data, error } = await query

      if (error) throw error

      setNotasCredito(data || [])
    } catch (error: any) {
      console.log('Error al cargar notas de crédito:', error)
      setMensaje(`Error al cargar notas de crédito: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  async function cargarReporteClientes() {
    setCargando(true)
    setMensaje('')

    try {
      const { data: clientesData, error: errorClientes } = await supabase
        .from('clientes')
        .select(
          'id_cliente, nombre_cliente, rtn, direccion, correo, telefono, nombre_contacto, fecha_registro'
        )
        .order('id_cliente', { ascending: false })

      if (errorClientes) throw errorClientes

      let queryFacturas = supabase
        .from('facturas')
        .select(
          'id_factura, id_cliente, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado'
        )
        .order('fecha_factura', { ascending: false })

      if (fechaDesde) {
        queryFacturas = queryFacturas.gte('fecha_factura', fechaDesde)
      }

      if (fechaHasta) {
        queryFacturas = queryFacturas.lte('fecha_factura', fechaHasta)
      }

      const { data: facturasData, error: errorFacturas } = await queryFacturas

      if (errorFacturas) throw errorFacturas

      setClientes(clientesData || [])
      setFacturasClientes(facturasData || [])
    } catch (error: any) {
      console.log('Error al cargar reporte de clientes:', error)
      setMensaje(`Error al cargar reporte de clientes: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  function limpiarFiltroVentas() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaVentas('')

    setTimeout(() => {
      cargarFacturas()
    }, 0)
  }

  function limpiarFiltroRecibos() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaRecibos('')

    setTimeout(() => {
      cargarRecibos()
    }, 0)
  }

  function limpiarFiltroNotasCredito() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaNotasCredito('')

    setTimeout(() => {
      cargarNotasCredito()
    }, 0)
  }

  function limpiarFiltroClientes() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaCliente('')

    setTimeout(() => {
      cargarReporteClientes()
    }, 0)
  }

  const facturasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaVentas)

    if (!texto) return facturas

    return facturas.filter((factura) => {
      return (
        normalizarTexto(factura.nombre_cliente).includes(texto) ||
        normalizarTexto(factura.secuencia_fiscal).includes(texto)
      )
    })
  }, [facturas, busquedaVentas])

  const recibosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaRecibos)

    if (!texto) return recibos

    return recibos.filter((recibo) => {
      return (
        normalizarTexto(recibo.nombre_cliente).includes(texto) ||
        normalizarTexto(recibo.secuencia_recibo).includes(texto) ||
        normalizarTexto(recibo.descripcion).includes(texto)
      )
    })
  }, [recibos, busquedaRecibos])

  const notasCreditoFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaNotasCredito)

    if (!texto) return notasCredito

    return notasCredito.filter((nota) => {
      return (
        normalizarTexto(nota.nombre_cliente).includes(texto) ||
        normalizarTexto(nota.secuencia_fiscal).includes(texto) ||
        normalizarTexto(nota.descripcion).includes(texto)
      )
    })
  }, [notasCredito, busquedaNotasCredito])

  const resumenVentas = useMemo(() => {
    const totalFacturas = facturasFiltradas.length
    const subtotal = facturasFiltradas.reduce(
      (acc, factura) => acc + Number(factura.subtotal || 0),
      0
    )
    const impuesto = facturasFiltradas.reduce(
      (acc, factura) => acc + Number(factura.impuesto_total || 0),
      0
    )
    const total = facturasFiltradas.reduce(
      (acc, factura) => acc + Number(factura.total_factura || 0),
      0
    )
    const ticketPromedio = totalFacturas > 0 ? total / totalFacturas : 0

    return {
      totalFacturas,
      subtotal,
      impuesto,
      total,
      ticketPromedio,
    }
  }, [facturasFiltradas])

  const resumenRecibos = useMemo(() => {
    const totalRecibos = recibosFiltrados.length
    const totalRecibido = recibosFiltrados.reduce(
      (acc, recibo) => acc + Number(recibo.valor_recibido || 0),
      0
    )
    const promedioRecibido = totalRecibos > 0 ? totalRecibido / totalRecibos : 0

    const mayorRecibo = [...recibosFiltrados].sort(
      (a, b) => Number(b.valor_recibido || 0) - Number(a.valor_recibido || 0)
    )[0]

    return {
      totalRecibos,
      totalRecibido,
      promedioRecibido,
      mayorRecibo,
    }
  }, [recibosFiltrados])

  const resumenNotasCredito = useMemo(() => {
    const totalNotas = notasCreditoFiltradas.length
    const totalNotasCredito = notasCreditoFiltradas.reduce(
      (acc, nota) => acc + Number(nota.valor_nota || 0),
      0
    )
    const promedioNota = totalNotas > 0 ? totalNotasCredito / totalNotas : 0

    const mayorNota = [...notasCreditoFiltradas].sort(
      (a, b) => Number(b.valor_nota || 0) - Number(a.valor_nota || 0)
    )[0]

    return {
      totalNotas,
      totalNotasCredito,
      promedioNota,
      mayorNota,
    }
  }, [notasCreditoFiltradas])

  const clientesConVentas = useMemo<ClienteConVentas[]>(() => {
    const ventasPorCliente = new Map<
      number,
      {
        cantidad_facturas: number
        subtotal_facturado: number
        impuesto_facturado: number
        total_facturado: number
        ultima_factura: string | null
      }
    >()

    for (const factura of facturasClientes) {
      if (!factura.id_cliente) continue

      const actual =
        ventasPorCliente.get(factura.id_cliente) ||
        {
          cantidad_facturas: 0,
          subtotal_facturado: 0,
          impuesto_facturado: 0,
          total_facturado: 0,
          ultima_factura: null,
        }

      actual.cantidad_facturas += 1
      actual.subtotal_facturado += Number(factura.subtotal || 0)
      actual.impuesto_facturado += Number(factura.impuesto_total || 0)
      actual.total_facturado += Number(factura.total_factura || 0)

      if (!actual.ultima_factura || factura.fecha_factura > actual.ultima_factura) {
        actual.ultima_factura = factura.fecha_factura
      }

      ventasPorCliente.set(factura.id_cliente, actual)
    }

    return clientes.map((cliente) => {
      const ventas =
        ventasPorCliente.get(cliente.id_cliente) ||
        {
          cantidad_facturas: 0,
          subtotal_facturado: 0,
          impuesto_facturado: 0,
          total_facturado: 0,
          ultima_factura: null,
        }

      return {
        ...cliente,
        ...ventas,
      }
    })
  }, [clientes, facturasClientes])

  const clientesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaCliente)

    if (!texto) return clientesConVentas

    return clientesConVentas.filter((cliente) => {
      return (
        normalizarTexto(cliente.nombre_cliente).includes(texto) ||
        normalizarTexto(cliente.rtn).includes(texto) ||
        normalizarTexto(cliente.telefono).includes(texto) ||
        normalizarTexto(cliente.correo).includes(texto) ||
        normalizarTexto(cliente.nombre_contacto).includes(texto) ||
        normalizarTexto(cliente.direccion).includes(texto)
      )
    })
  }, [clientesConVentas, busquedaCliente])

  const resumenClientes = useMemo(() => {
    const totalClientes = clientesFiltrados.length
    const clientesConVenta = clientesFiltrados.filter((cliente) => cliente.cantidad_facturas > 0).length
    const clientesSinVenta = totalClientes - clientesConVenta
    const totalFacturado = clientesFiltrados.reduce(
      (acc, cliente) => acc + Number(cliente.total_facturado || 0),
      0
    )

    const clienteMayorFacturacion = [...clientesFiltrados].sort(
      (a, b) => Number(b.total_facturado || 0) - Number(a.total_facturado || 0)
    )[0]

    return {
      totalClientes,
      clientesConVenta,
      clientesSinVenta,
      totalFacturado,
      clienteMayorFacturacion,
    }
  }, [clientesFiltrados])

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
                setBusquedaVentas('')
                setBusquedaRecibos('')
                setBusquedaNotasCredito('')
                setBusquedaCliente('')
              }}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
            >
              <option value="ventas">Reporte de Ventas</option>
              <option value="clientes">Reporte de Clientes</option>
              <option value="recibos">Reporte de Recibos</option>
              <option value="notasCredito">Reporte de Notas de Crédito</option>
            </select>
          </div>
        </div>
      </div>

      {tipoReporte === 'ventas' && (
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            <div>
              <label className="block mb-1 font-medium text-black">Buscar venta</label>
              <input
                type="text"
                value={busquedaVentas}
                onChange={(e) => setBusquedaVentas(e.target.value)}
                placeholder="Cliente o número de factura"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={cargarFacturas}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Filtrar ventas
            </button>

            <button
              type="button"
              onClick={limpiarFiltroVentas}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
            >
              Mostrar todas
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Facturas</p>
              <p className="text-2xl font-bold text-black">{resumenVentas.totalFacturas}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total vendido</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenVentas.total)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total impuesto</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenVentas.impuesto)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Ticket promedio</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenVentas.ticketPromedio)}</p>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {facturasFiltradas.length} de {facturas.length} factura(s)
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
                    <th className="p-3 text-left border border-gray-200">Número de Factura</th>
                    <th className="p-3 text-left border border-gray-200">Cliente</th>
                    <th className="p-3 text-center border border-gray-200">Fecha</th>
                    <th className="p-3 text-right border border-gray-200">Subtotal</th>
                    <th className="p-3 text-right border border-gray-200">Impuesto</th>
                    <th className="p-3 text-right border border-gray-200">Total</th>
                    <th className="p-3 text-center border border-gray-200">Estado</th>
                    <th className="p-3 text-center border border-gray-200">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay facturas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    facturasFiltradas.map((factura) => (
                      <tr key={factura.id_factura} className="bg-white text-black">
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
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirFactura(factura.id_factura)}
                            className="rounded-lg bg-cyan-600 px-3 py-1 text-sm font-semibold text-white hover:bg-cyan-500"
                          >
                            Ver
                          </button>
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

      {tipoReporte === 'recibos' && (
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            <div>
              <label className="block mb-1 font-medium text-black">Buscar recibo</label>
              <input
                type="text"
                value={busquedaRecibos}
                onChange={(e) => setBusquedaRecibos(e.target.value)}
                placeholder="Cliente, número de recibo o concepto"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={cargarRecibos}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Filtrar recibos
            </button>

            <button
              type="button"
              onClick={limpiarFiltroRecibos}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
            >
              Mostrar todos
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Recibos</p>
              <p className="text-2xl font-bold text-black">{resumenRecibos.totalRecibos}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total recibido</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenRecibos.totalRecibido)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Promedio recibido</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenRecibos.promedioRecibido)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Mayor recibo</p>
              <p className="text-base font-bold text-black">
                {resumenRecibos.mayorRecibo?.secuencia_recibo || '-'}
              </p>
              <p className="text-sm text-gray-600">
                {moneda(resumenRecibos.mayorRecibo?.valor_recibido || 0)}
              </p>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {recibosFiltrados.length} de {recibos.length} recibo(s)
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-gray-300 bg-white p-6 text-black">
              Cargando reporte de recibos...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-black">
                  <tr>
                    <th className="p-3 text-left border border-gray-200">Número de Recibo</th>
                    <th className="p-3 text-left border border-gray-200">Cliente</th>
                    <th className="p-3 text-center border border-gray-200">Fecha</th>
                    <th className="p-3 text-left border border-gray-200">Concepto</th>
                    <th className="p-3 text-right border border-gray-200">Valor recibido</th>
                    <th className="p-3 text-center border border-gray-200">Estado</th>
                    <th className="p-3 text-center border border-gray-200">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {recibosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay recibos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    recibosFiltrados.map((recibo) => (
                      <tr key={recibo.id_recibo} className="bg-white text-black">
                        <td className="p-3 border border-gray-200">
                          {recibo.secuencia_recibo}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {recibo.nombre_cliente}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {formatearFecha(recibo.fecha_recibo)}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {recibo.descripcion}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(recibo.valor_recibido)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {recibo.estado}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirRecibo(recibo.id_recibo)}
                            className="rounded-lg bg-cyan-600 px-3 py-1 text-sm font-semibold text-white hover:bg-cyan-500"
                          >
                            Ver
                          </button>
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

      {tipoReporte === 'notasCredito' && (
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            <div>
              <label className="block mb-1 font-medium text-black">Buscar nota</label>
              <input
                type="text"
                value={busquedaNotasCredito}
                onChange={(e) => setBusquedaNotasCredito(e.target.value)}
                placeholder="Cliente, número de nota o concepto"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={cargarNotasCredito}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Filtrar notas
            </button>

            <button
              type="button"
              onClick={limpiarFiltroNotasCredito}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
            >
              Mostrar todas
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Notas de crédito</p>
              <p className="text-2xl font-bold text-black">{resumenNotasCredito.totalNotas}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total en notas</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenNotasCredito.totalNotasCredito)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Promedio nota</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenNotasCredito.promedioNota)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Mayor nota</p>
              <p className="text-base font-bold text-black">
                {resumenNotasCredito.mayorNota?.secuencia_fiscal || '-'}
              </p>
              <p className="text-sm text-gray-600">
                {moneda(resumenNotasCredito.mayorNota?.valor_nota || 0)}
              </p>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {notasCreditoFiltradas.length} de {notasCredito.length} nota(s)
          </div>

          {mensaje && (
            <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="rounded-xl border border-gray-300 bg-white p-6 text-black">
              Cargando reporte de notas de crédito...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-black">
                  <tr>
                    <th className="p-3 text-left border border-gray-200">Número de Nota</th>
                    <th className="p-3 text-left border border-gray-200">Cliente</th>
                    <th className="p-3 text-center border border-gray-200">Fecha</th>
                    <th className="p-3 text-left border border-gray-200">Concepto</th>
                    <th className="p-3 text-right border border-gray-200">Valor nota</th>
                    <th className="p-3 text-center border border-gray-200">Estado</th>
                    <th className="p-3 text-center border border-gray-200">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {notasCreditoFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay notas de crédito para mostrar.
                      </td>
                    </tr>
                  ) : (
                    notasCreditoFiltradas.map((nota) => (
                      <tr key={nota.id_nota_credito} className="bg-white text-black">
                        <td className="p-3 border border-gray-200">
                          {nota.secuencia_fiscal}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {nota.nombre_cliente}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {formatearFecha(nota.fecha_nota)}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {nota.descripcion}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(nota.valor_nota)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {nota.estado}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirNotaCredito(nota.id_nota_credito)}
                            className="rounded-lg bg-cyan-600 px-3 py-1 text-sm font-semibold text-white hover:bg-cyan-500"
                          >
                            Ver
                          </button>
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            <div>
              <label className="block mb-1 font-medium text-black">Buscar cliente</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Nombre, RTN, teléfono o correo"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={cargarReporteClientes}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Filtrar clientes
            </button>

            <button
              type="button"
              onClick={limpiarFiltroClientes}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
            >
              Mostrar todos
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Clientes</p>
              <p className="text-2xl font-bold text-black">{resumenClientes.totalClientes}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Clientes con ventas</p>
              <p className="text-2xl font-bold text-black">{resumenClientes.clientesConVenta}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total facturado</p>
              <p className="text-2xl font-bold text-black">{moneda(resumenClientes.totalFacturado)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Mayor cliente</p>
              <p className="text-base font-bold text-black">
                {resumenClientes.clienteMayorFacturacion?.nombre_cliente || '-'}
              </p>
              <p className="text-sm text-gray-600">
                {moneda(resumenClientes.clienteMayorFacturacion?.total_facturado || 0)}
              </p>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Mostrando {clientesFiltrados.length} de {clientes.length} cliente(s)
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
                    <th className="p-3 text-left border border-gray-200">Nombre</th>
                    <th className="p-3 text-left border border-gray-200">RTN</th>
                    <th className="p-3 text-left border border-gray-200">Correo</th>
                    <th className="p-3 text-left border border-gray-200">Teléfono</th>
                    <th className="p-3 text-center border border-gray-200">Facturas</th>
                    <th className="p-3 text-right border border-gray-200">Subtotal</th>
                    <th className="p-3 text-right border border-gray-200">Impuesto</th>
                    <th className="p-3 text-right border border-gray-200">Ventas totales</th>
                    <th className="p-3 text-center border border-gray-200">Última compra</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                      >
                        No hay clientes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id_cliente} className="bg-white text-black">
                        <td className="p-3 border border-gray-200">
                          {cliente.nombre_cliente}
                        </td>
                        <td className="p-3 border border-gray-200">{cliente.rtn || '-'}</td>
                        <td className="p-3 border border-gray-200">{cliente.correo || '-'}</td>
                        <td className="p-3 border border-gray-200">
                          {cliente.telefono || '-'}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {cliente.cantidad_facturas}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(cliente.subtotal_facturado)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {moneda(cliente.impuesto_facturado)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right font-semibold">
                          {moneda(cliente.total_facturado)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {formatearFecha(cliente.ultima_factura)}
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
