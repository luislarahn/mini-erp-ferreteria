'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
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
  descripcion_anulacion: string | null
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
  descripcion_aplicacion: string | null
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
  id_factura_aplicada: number | null
  factura_aplicada: string | null
  descripcion_aplicacion: string | null
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

type TablaReporte = {
  titulo: string
  nombreArchivo: string
  encabezados: string[]
  filas: Array<Array<string | number>>
}

function moneda(valor: number | null | undefined) {
  const numero = Number(valor) || 0

  return `L ${numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function numeroMoneda(valor: number | null | undefined) {
  return Number((Number(valor) || 0).toFixed(2))
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

function limpiarNombreArchivo(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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

function escaparHtml(valor: string | number) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function ReportesTab() {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('ventas')

  const [facturas, setFacturas] = useState<Factura[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [facturasClientes, setFacturasClientes] = useState<Factura[]>([])
  const [facturasParaNota, setFacturasParaNota] = useState<Factura[]>([])

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busquedaVentas, setBusquedaVentas] = useState('')
  const [busquedaRecibos, setBusquedaRecibos] = useState('')
  const [busquedaNotasCredito, setBusquedaNotasCredito] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [modalAplicarAbierto, setModalAplicarAbierto] = useState(false)
  const [reciboSeleccionado, setReciboSeleccionado] = useState<Recibo | null>(null)
  const [descripcionAplicacion, setDescripcionAplicacion] = useState('')
  const [guardandoAplicacion, setGuardandoAplicacion] = useState(false)

  const [modalAnularAbierto, setModalAnularAbierto] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [descripcionAnulacion, setDescripcionAnulacion] = useState('')
  const [guardandoAnulacion, setGuardandoAnulacion] = useState(false)

  const [modalNotaAbierto, setModalNotaAbierto] = useState(false)
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCredito | null>(null)
  const [descripcionAplicacionNota, setDescripcionAplicacionNota] = useState('')
  const [idFacturaAplicada, setIdFacturaAplicada] = useState<number | ''>('')
  const [busquedaFacturaNota, setBusquedaFacturaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

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
          'id_factura, id_cliente, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado, descripcion_anulacion'
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
          'id_recibo, id_cliente, secuencia_recibo, nombre_cliente, fecha_recibo, descripcion, valor_recibido, estado, descripcion_aplicacion'
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
          'id_nota_credito, id_cliente, secuencia_fiscal, nombre_cliente, fecha_nota, descripcion, valor_nota, estado, id_factura_aplicada, factura_aplicada, descripcion_aplicacion'
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


  async function cargarFacturasParaNotas() {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select(
          'id_factura, id_cliente, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado, descripcion_anulacion'
        )
        .eq('estado', 'Emitida')
        .order('id_factura', { ascending: false })

      if (error) throw error

      setFacturasParaNota(data || [])
    } catch (error: any) {
      console.log('Error al cargar facturas para notas de crédito:', error)
      setMensaje(`Error al cargar facturas para notas de crédito: ${error?.message || 'Error inesperado.'}`)
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
          'id_factura, id_cliente, secuencia_fiscal, nombre_cliente, fecha_factura, subtotal, impuesto_total, total_factura, estado, descripcion_anulacion'
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
    setFiltroEstado('Todos')

    setTimeout(() => {
      cargarFacturas()
    }, 0)
  }

  function limpiarFiltroRecibos() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaRecibos('')
    setFiltroEstado('Todos')

    setTimeout(() => {
      cargarRecibos()
    }, 0)
  }

  function limpiarFiltroNotasCredito() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaNotasCredito('')
    setFiltroEstado('Todos')

    setTimeout(() => {
      cargarNotasCredito()
    }, 0)
  }

  function limpiarFiltroClientes() {
    setFechaDesde('')
    setFechaHasta('')
    setBusquedaCliente('')
    setFiltroEstado('Todos')

    setTimeout(() => {
      cargarReporteClientes()
    }, 0)
  }

  function abrirModalEstadoFactura(factura: Factura) {
    setMensaje('')
    setFacturaSeleccionada(factura)
    setDescripcionAnulacion(factura.descripcion_anulacion || '')
    setModalAnularAbierto(true)
  }

  function cerrarModalEstadoFactura() {
    setModalAnularAbierto(false)
    setFacturaSeleccionada(null)
    setDescripcionAnulacion('')
    setGuardandoAnulacion(false)
  }

  async function guardarAnulacionFactura() {
    setMensaje('')

    if (!facturaSeleccionada) {
      setMensaje('No se ha seleccionado ninguna factura.')
      return
    }

    if (descripcionAnulacion.trim() === '') {
      setMensaje('Debe ingresar una descripción para indicar por qué se anuló la factura.')
      return
    }

    setGuardandoAnulacion(true)

    try {
      const { error } = await supabase
        .from('facturas')
        .update({
          estado: 'Anulada',
          descripcion_anulacion: descripcionAnulacion.trim(),
        })
        .eq('id_factura', facturaSeleccionada.id_factura)

      if (error) throw error

      setMensaje(`La factura ${facturaSeleccionada.secuencia_fiscal} fue marcada como Anulada.`)
      cerrarModalEstadoFactura()
      await cargarFacturas()
    } catch (error: any) {
      console.log('Error al anular factura:', error)
      setMensaje(`Error al anular factura: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardandoAnulacion(false)
    }
  }

  async function emitirFacturaDeNuevo() {
    setMensaje('')

    if (!facturaSeleccionada) {
      setMensaje('No se ha seleccionado ninguna factura.')
      return
    }

    setGuardandoAnulacion(true)

    try {
      const { error } = await supabase
        .from('facturas')
        .update({
          estado: 'Emitida',
          descripcion_anulacion: null,
        })
        .eq('id_factura', facturaSeleccionada.id_factura)

      if (error) throw error

      setMensaje(`La factura ${facturaSeleccionada.secuencia_fiscal} fue emitida nuevamente.`)
      cerrarModalEstadoFactura()
      await cargarFacturas()
    } catch (error: any) {
      console.log('Error al emitir nuevamente la factura:', error)
      setMensaje(`Error al emitir nuevamente la factura: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardandoAnulacion(false)
    }
  }

  async function abrirModalEstadoNota(nota: NotaCredito) {
    setMensaje('')
    setNotaSeleccionada(nota)
    setDescripcionAplicacionNota(nota.descripcion_aplicacion || '')
    setIdFacturaAplicada(nota.id_factura_aplicada || '')
    setBusquedaFacturaNota(nota.factura_aplicada || '')
    setModalNotaAbierto(true)
    await cargarFacturasParaNotas()
  }

  function cerrarModalEstadoNota() {
    setModalNotaAbierto(false)
    setNotaSeleccionada(null)
    setDescripcionAplicacionNota('')
    setIdFacturaAplicada('')
    setBusquedaFacturaNota('')
    setGuardandoNota(false)
  }

  async function guardarAplicacionNota() {
    setMensaje('')

    if (!notaSeleccionada) {
      setMensaje('No se ha seleccionado ninguna nota de crédito.')
      return
    }

    if (!idFacturaAplicada) {
      setMensaje('Debe seleccionar la factura a la que se aplicará la nota de crédito.')
      return
    }

    if (descripcionAplicacionNota.trim() === '') {
      setMensaje('Debe ingresar una descripción para indicar cómo se aplicó la nota de crédito.')
      return
    }

    const facturaSeleccionadaNota = facturasParaNota.find(
      (factura) => factura.id_factura === Number(idFacturaAplicada)
    )

    if (!facturaSeleccionadaNota) {
      setMensaje('La factura seleccionada no está disponible o no se encuentra emitida.')
      return
    }

    setGuardandoNota(true)

    try {
      const { error } = await supabase
        .from('notas_credito')
        .update({
          estado: 'Aplicada',
          id_factura_aplicada: facturaSeleccionadaNota.id_factura,
          factura_aplicada: facturaSeleccionadaNota.secuencia_fiscal,
          descripcion_aplicacion: descripcionAplicacionNota.trim(),
        })
        .eq('id_nota_credito', notaSeleccionada.id_nota_credito)

      if (error) throw error

      setMensaje(
        `La nota de crédito ${notaSeleccionada.secuencia_fiscal} fue aplicada a la factura ${facturaSeleccionadaNota.secuencia_fiscal}.`
      )
      cerrarModalEstadoNota()
      await cargarNotasCredito()
    } catch (error: any) {
      console.log('Error al aplicar nota de crédito:', error)
      setMensaje(`Error al aplicar nota de crédito: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardandoNota(false)
    }
  }

  async function revertirAplicacionNota() {
    setMensaje('')

    if (!notaSeleccionada) {
      setMensaje('No se ha seleccionado ninguna nota de crédito.')
      return
    }

    setGuardandoNota(true)

    try {
      const { error } = await supabase
        .from('notas_credito')
        .update({
          estado: 'Emitida',
          id_factura_aplicada: null,
          factura_aplicada: null,
          descripcion_aplicacion: null,
        })
        .eq('id_nota_credito', notaSeleccionada.id_nota_credito)

      if (error) throw error

      setMensaje(`La aplicación de la nota de crédito ${notaSeleccionada.secuencia_fiscal} fue revertida.`)
      cerrarModalEstadoNota()
      await cargarNotasCredito()
    } catch (error: any) {
      console.log('Error al revertir nota de crédito:', error)
      setMensaje(`Error al revertir nota de crédito: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardandoNota(false)
    }
  }

  function abrirModalAplicarRecibo(recibo: Recibo) {
    setMensaje('')
    setReciboSeleccionado(recibo)
    setDescripcionAplicacion(recibo.descripcion_aplicacion || '')
    setModalAplicarAbierto(true)
  }

  function cerrarModalAplicarRecibo() {
    setModalAplicarAbierto(false)
    setReciboSeleccionado(null)
    setDescripcionAplicacion('')
    setGuardandoAplicacion(false)
  }

  async function guardarAplicacionRecibo() {
    setMensaje('')

    if (!reciboSeleccionado) {
      setMensaje('No se ha seleccionado ningún recibo.')
      return
    }

    if (descripcionAplicacion.trim() === '') {
      setMensaje('Debe ingresar una descripción para indicar cómo se aplicó el saldo.')
      return
    }

    setGuardandoAplicacion(true)

    try {
      const { error } = await supabase
        .from('recibos_pago')
        .update({
          estado: 'Aplicado',
          descripcion_aplicacion: descripcionAplicacion.trim(),
        })
        .eq('id_recibo', reciboSeleccionado.id_recibo)

      if (error) throw error

      setMensaje(`El recibo ${reciboSeleccionado.secuencia_recibo} fue marcado como Aplicado.`)
      cerrarModalAplicarRecibo()
      await cargarRecibos()
    } catch (error: any) {
      console.log('Error al aplicar recibo:', error)
      setMensaje(`Error al aplicar recibo: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardandoAplicacion(false)
    }
  }

  function cumpleFiltroEstado(estado: string | null | undefined) {
    if (filtroEstado === 'Todos') return true
    return normalizarTexto(estado) === normalizarTexto(filtroEstado)
  }

  const facturasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaVentas)

    return facturas.filter((factura) => {
      const coincideEstado = cumpleFiltroEstado(factura.estado)
      const coincideTexto =
        !texto ||
        normalizarTexto(factura.nombre_cliente).includes(texto) ||
        normalizarTexto(factura.secuencia_fiscal).includes(texto) ||
        normalizarTexto(factura.descripcion_anulacion).includes(texto)

      return coincideEstado && coincideTexto
    })
  }, [facturas, busquedaVentas, filtroEstado])

  const recibosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaRecibos)

    return recibos.filter((recibo) => {
      const coincideEstado = cumpleFiltroEstado(recibo.estado)
      const coincideTexto =
        !texto ||
        normalizarTexto(recibo.nombre_cliente).includes(texto) ||
        normalizarTexto(recibo.secuencia_recibo).includes(texto) ||
        normalizarTexto(recibo.descripcion).includes(texto) ||
        normalizarTexto(recibo.descripcion_aplicacion).includes(texto)

      return coincideEstado && coincideTexto
    })
  }, [recibos, busquedaRecibos, filtroEstado])

  const notasCreditoFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaNotasCredito)

    return notasCredito.filter((nota) => {
      const coincideEstado = cumpleFiltroEstado(nota.estado)
      const coincideTexto =
        !texto ||
        normalizarTexto(nota.nombre_cliente).includes(texto) ||
        normalizarTexto(nota.secuencia_fiscal).includes(texto) ||
        normalizarTexto(nota.descripcion).includes(texto) ||
        normalizarTexto(nota.factura_aplicada).includes(texto) ||
        normalizarTexto(nota.descripcion_aplicacion).includes(texto)

      return coincideEstado && coincideTexto
    })
  }, [notasCredito, busquedaNotasCredito, filtroEstado])

  const facturasParaNotaFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaFacturaNota)

    if (!texto) return facturasParaNota

    return facturasParaNota.filter((factura) => {
      return (
        normalizarTexto(factura.secuencia_fiscal).includes(texto) ||
        normalizarTexto(factura.nombre_cliente).includes(texto)
      )
    })
  }, [facturasParaNota, busquedaFacturaNota])

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
      if (!cumpleFiltroEstado(factura.estado)) continue

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
  }, [clientes, facturasClientes, filtroEstado])

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

  function obtenerPeriodoReporte() {
    const estadoTexto = filtroEstado === 'Todos' ? '' : ` | Estado: ${filtroEstado}`

    if (!fechaDesde && !fechaHasta) return `Periodo: Todos los registros${estadoTexto}`

    const inicio = fechaDesde ? formatearFecha(fechaDesde) : 'Inicio'
    const final = fechaHasta ? formatearFecha(fechaHasta) : 'Actual'

    return `Periodo: ${inicio} al ${final}${estadoTexto}`
  }

  function obtenerTablaReporte(): TablaReporte {
    const periodo = obtenerPeriodoReporte()

    if (tipoReporte === 'ventas') {
      return {
        titulo: `Reporte de Ventas - ${periodo}`,
        nombreArchivo: 'reporte_ventas',
        encabezados: [
          'Número de Factura',
          'Cliente',
          'Fecha',
          'Subtotal',
          'Impuesto',
          'Total',
          'Estado',
          'Motivo de anulación',
        ],
        filas: facturasFiltradas.map((factura) => [
          factura.secuencia_fiscal,
          factura.nombre_cliente,
          formatearFecha(factura.fecha_factura),
          numeroMoneda(factura.subtotal),
          numeroMoneda(factura.impuesto_total),
          numeroMoneda(factura.total_factura),
          factura.estado,
          factura.descripcion_anulacion || '-',
        ]),
      }
    }

    if (tipoReporte === 'recibos') {
      return {
        titulo: `Reporte de Recibos - ${periodo}`,
        nombreArchivo: 'reporte_recibos',
        encabezados: [
          'Número de Recibo',
          'Cliente',
          'Fecha',
          'Concepto',
          'Aplicación',
          'Valor recibido',
          'Estado',
        ],
        filas: recibosFiltrados.map((recibo) => [
          recibo.secuencia_recibo,
          recibo.nombre_cliente,
          formatearFecha(recibo.fecha_recibo),
          recibo.descripcion,
          recibo.descripcion_aplicacion || '-',
          numeroMoneda(recibo.valor_recibido),
          recibo.estado,
        ]),
      }
    }

    if (tipoReporte === 'notasCredito') {
      return {
        titulo: `Reporte de Notas de Crédito - ${periodo}`,
        nombreArchivo: 'reporte_notas_credito',
        encabezados: [
          'Número de Nota',
          'Cliente',
          'Fecha',
          'Concepto',
          'Factura aplicada',
          'Aplicación',
          'Valor nota',
          'Estado',
        ],
        filas: notasCreditoFiltradas.map((nota) => [
          nota.secuencia_fiscal,
          nota.nombre_cliente,
          formatearFecha(nota.fecha_nota),
          nota.descripcion,
          nota.factura_aplicada || '-',
          nota.descripcion_aplicacion || '-',
          numeroMoneda(nota.valor_nota),
          nota.estado,
        ]),
      }
    }

    return {
      titulo: `Reporte de Clientes - ${periodo}`,
      nombreArchivo: 'reporte_clientes',
      encabezados: [
        'Cliente',
        'RTN',
        'Correo',
        'Teléfono',
        'Facturas',
        'Subtotal',
        'Impuesto',
        'Ventas totales',
        'Última compra',
      ],
      filas: clientesFiltrados.map((cliente) => [
        cliente.nombre_cliente,
        cliente.rtn || '-',
        cliente.correo || '-',
        cliente.telefono || '-',
        cliente.cantidad_facturas,
        numeroMoneda(cliente.subtotal_facturado),
        numeroMoneda(cliente.impuesto_facturado),
        numeroMoneda(cliente.total_facturado),
        formatearFecha(cliente.ultima_factura),
      ]),
    }
  }

  function exportarExcel() {
    const tabla = obtenerTablaReporte()

    if (tabla.filas.length === 0) {
      setMensaje('No hay datos para exportar con los filtros actuales.')
      return
    }

    const datos = tabla.filas.map((fila) => {
      const registro: Record<string, string | number> = {}

      tabla.encabezados.forEach((encabezado, index) => {
        registro[encabezado] = fila[index]
      })

      return registro
    })

    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()

    hoja['!cols'] = tabla.encabezados.map((encabezado, index) => {
      const mayorDato = tabla.filas.reduce((max, fila) => {
        return Math.max(max, String(fila[index] ?? '').length)
      }, encabezado.length)

      return {
        wch: Math.min(Math.max(mayorDato + 4, 14), 45),
      }
    })

    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')

    const fechaArchivo = new Date().toISOString().split('T')[0]
    const nombreArchivo = `${limpiarNombreArchivo(tabla.nombreArchivo)}_${fechaArchivo}.xlsx`

    XLSX.writeFile(libro, nombreArchivo)
  }

  function imprimirPDF() {
    const tabla = obtenerTablaReporte()

    if (tabla.filas.length === 0) {
      setMensaje('No hay datos para imprimir con los filtros actuales.')
      return
    }

    const fechaGeneracion = new Date().toLocaleString('es-HN')
    const filasHtml = tabla.filas
      .map(
        (fila) => `
          <tr>
            ${fila.map((celda) => `<td>${escaparHtml(celda)}</td>`).join('')}
          </tr>
        `
      )
      .join('')

    const encabezadosHtml = tabla.encabezados
      .map((encabezado) => `<th>${escaparHtml(encabezado)}</th>`)
      .join('')

    const ventana = window.open('', '_blank')

    if (!ventana) {
      setMensaje('No se pudo abrir la ventana de impresión. Revise si el navegador bloqueó ventanas emergentes.')
      return
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escaparHtml(tabla.titulo)}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111827;
              font-family: Arial, sans-serif;
              font-size: 8px;
            }

            .contenedor {
              width: 100%;
            }

            .encabezado {
              text-align: center;
              margin-bottom: 7px;
              border-bottom: 1px solid #111827;
              padding-bottom: 5px;
            }

            .empresa {
              font-size: 13px;
              font-weight: 700;
              margin: 0;
            }

            .subtitulo {
              font-size: 8px;
              margin: 2px 0;
            }

            .titulo {
              font-size: 10px;
              font-weight: 700;
              margin: 6px 0 2px 0;
              text-transform: uppercase;
            }

            .meta {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-size: 7.5px;
              margin-bottom: 7px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 2.8px 3px;
              vertical-align: top;
              word-break: break-word;
              overflow-wrap: anywhere;
              line-height: 1.2;
            }

            th {
              background: #f3f4f6;
              font-weight: 700;
              text-align: left;
            }

            td:nth-child(n+4),
            th:nth-child(n+4) {
              text-align: right;
            }

            td:nth-child(1),
            th:nth-child(1),
            td:nth-child(2),
            th:nth-child(2),
            td:nth-child(3),
            th:nth-child(3) {
              text-align: left;
            }

            .pie {
              margin-top: 7px;
              font-size: 7px;
              color: #374151;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #d1d5db;
              padding-top: 4px;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <div class="contenedor">
            <div class="encabezado">
              <p class="empresa">Ferretería PROIS</p>
              <p class="subtitulo">RTN 08011920048018 | contacto@prois.com</p>
              <p class="titulo">${escaparHtml(tabla.titulo)}</p>
            </div>

            <div class="meta">
              <div><strong>Registros mostrados:</strong> ${tabla.filas.length}</div>
              <div><strong>Generado:</strong> ${escaparHtml(fechaGeneracion)}</div>
            </div>

            <table>
              <thead>
                <tr>${encabezadosHtml}</tr>
              </thead>
              <tbody>
                ${filasHtml}
              </tbody>
            </table>

            <div class="pie">
              <div>Reporte generado desde el Mini ERP Ferretería PROIS.</div>
              <div>Hoja tamaño carta vertical.</div>
            </div>
          </div>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `)

    ventana.document.close()
  }

  function obtenerOpcionesEstado() {
    if (tipoReporte === 'recibos') {
      return [
        { valor: 'Todos', etiqueta: 'Todos' },
        { valor: 'Emitido', etiqueta: 'Emitidos' },
        { valor: 'Aplicado', etiqueta: 'Aplicados' },
      ]
    }

    if (tipoReporte === 'notasCredito') {
      return [
        { valor: 'Todos', etiqueta: 'Todas' },
        { valor: 'Emitida', etiqueta: 'Emitidas' },
        { valor: 'Aplicada', etiqueta: 'Aplicadas' },
      ]
    }

    return [
      { valor: 'Todos', etiqueta: 'Todas' },
      { valor: 'Emitida', etiqueta: 'Emitidas' },
      { valor: 'Anulada', etiqueta: 'Anuladas' },
    ]
  }

  function SelectEstado() {
    const opciones = obtenerOpcionesEstado()

    return (
      <div>
        <label className="block mb-1 font-medium text-black">Filtrar por estado</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
        >
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>
    )
  }

  function BotonesExportacion() {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={exportarExcel}
          className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-600"
        >
          Exportar Excel
        </button>

        <button
          type="button"
          onClick={imprimirPDF}
          className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-600"
        >
          Imprimir / PDF
        </button>
      </div>
    )
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Reportes</h2>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-80">
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
                setFiltroEstado('Todos')
              }}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
            >
              <option value="ventas">Reporte de Ventas</option>
              <option value="clientes">Reporte de Clientes</option>
              <option value="recibos">Reporte de Recibos</option>
              <option value="notasCredito">Reporte de Notas de Crédito</option>
            </select>
          </div>

          <BotonesExportacion />
        </div>
      </div>

      {tipoReporte === 'ventas' && (
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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

            <SelectEstado />

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
              <p className="text-sm text-gray-500">Sub Total Global</p>
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenVentas.subtotal)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total de Impuestos</p>
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenVentas.impuesto)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Facturado</p>
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenVentas.total)}</p>
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
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(factura.subtotal)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(factura.impuesto_total)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(factura.total_factura)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalEstadoFactura(factura)}
                            className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                              factura.estado === 'Anulada'
                                ? 'bg-red-700 hover:bg-red-600'
                                : 'bg-emerald-700 hover:bg-emerald-600'
                            }`}
                            title={
                              factura.estado === 'Anulada'
                                ? 'Factura anulada. Puede emitirla nuevamente.'
                                : 'Anular factura emitida.'
                            }
                          >
                            {factura.estado || 'Emitida'}
                          </button>

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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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

            <SelectEstado />

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
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenRecibos.totalRecibido)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Promedio recibido</p>
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenRecibos.promedioRecibido)}</p>
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
                          <div>{recibo.descripcion}</div>

                        </td>
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(recibo.valor_recibido)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalAplicarRecibo(recibo)}
                            className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                              recibo.estado === 'Aplicado'
                                ? 'bg-emerald-700 hover:bg-emerald-600'
                                : 'bg-amber-600 hover:bg-amber-500'
                            }`}
                            title={
                              recibo.estado === 'Aplicado'
                                ? 'Recibo aplicado. Puede editar la descripción.'
                                : 'Marcar recibo como aplicado.'
                            }
                          >
                            {recibo.estado || 'Emitido'}
                          </button>
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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

            <SelectEstado />

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
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenNotasCredito.totalNotasCredito)}</p>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Promedio nota</p>
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenNotasCredito.promedioNota)}</p>
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
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(nota.valor_nota)}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalEstadoNota(nota)}
                            className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                              nota.estado === 'Aplicada'
                                ? 'bg-emerald-700 hover:bg-emerald-600'
                                : 'bg-amber-600 hover:bg-amber-500'
                            }`}
                            title={
                              nota.estado === 'Aplicada'
                                ? 'Nota de crédito aplicada. Puede revertir la aplicación.'
                                : 'Aplicar nota de crédito a una factura.'
                            }
                          >
                            {nota.estado || 'Emitida'}
                          </button>
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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

            <SelectEstado />

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
              <p className="text-2xl font-bold text-black whitespace-nowrap">{moneda(resumenClientes.totalFacturado)}</p>
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
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(cliente.subtotal_facturado)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap">
                          {moneda(cliente.impuesto_facturado)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right whitespace-nowrap font-semibold">
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
      {modalNotaAbierto && notaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-black shadow-2xl">
            <h3 className="mb-2 text-xl font-bold">
              {notaSeleccionada.estado === 'Aplicada'
                ? 'Nota de crédito aplicada'
                : 'Aplicar nota de crédito'}
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              Nota: <strong>{notaSeleccionada.secuencia_fiscal}</strong> | Cliente:{' '}
              <strong>{notaSeleccionada.nombre_cliente}</strong> | Valor:{' '}
              <strong>{moneda(notaSeleccionada.valor_nota)}</strong>
            </p>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-black">
                  Buscar factura emitida
                </label>
                <input
                  type="text"
                  value={busquedaFacturaNota}
                  onChange={(e) => setBusquedaFacturaNota(e.target.value)}
                  placeholder="Número de factura o cliente"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-black">
                  Factura relacionada
                </label>
                <select
                  value={idFacturaAplicada}
                  onChange={(e) => setIdFacturaAplicada(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                  disabled={notaSeleccionada.estado === 'Aplicada'}
                >
                  <option value="">Seleccione una factura emitida</option>
                  {facturasParaNotaFiltradas.map((factura) => (
                    <option key={factura.id_factura} value={factura.id_factura}>
                      {factura.secuencia_fiscal} - {factura.nombre_cliente} - {moneda(factura.total_factura)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {notaSeleccionada.factura_aplicada && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Factura aplicada actualmente: <strong>{notaSeleccionada.factura_aplicada}</strong>
              </div>
            )}

            <label className="mb-1 block font-medium text-black">
              Descripción de aplicación de nota de crédito
            </label>

            <textarea
              value={descripcionAplicacionNota}
              onChange={(e) => setDescripcionAplicacionNota(e.target.value)}
              rows={5}
              placeholder="Ejemplo: Nota de crédito aplicada a factura número 000-003-01-00000008."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-500"
              disabled={notaSeleccionada.estado === 'Aplicada'}
            />

            <p className="mt-2 text-xs text-gray-500">
              Este texto se mostrará en la factura relacionada, debajo de No. Registro SAG, sin marca de agua.
            </p>

            <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cerrarModalEstadoNota}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-black hover:bg-gray-300"
              >
                Cancelar
              </button>

              {notaSeleccionada.estado === 'Aplicada' && (
                <button
                  type="button"
                  onClick={revertirAplicacionNota}
                  disabled={guardandoNota}
                  className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {guardandoNota ? 'Guardando...' : 'Revertir aplicación'}
                </button>
              )}

              {notaSeleccionada.estado !== 'Aplicada' && (
                <button
                  type="button"
                  onClick={guardarAplicacionNota}
                  disabled={guardandoNota}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {guardandoNota ? 'Guardando...' : 'Guardar y aplicar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalAnularAbierto && facturaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 text-black shadow-2xl">
            <h3 className="mb-2 text-xl font-bold">
              {facturaSeleccionada.estado === 'Anulada' ? 'Factura anulada' : 'Anular factura'}
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              Factura: <strong>{facturaSeleccionada.secuencia_fiscal}</strong> | Cliente:{' '}
              <strong>{facturaSeleccionada.nombre_cliente}</strong> | Total:{' '}
              <strong>{moneda(facturaSeleccionada.total_factura)}</strong>
            </p>

            <label className="mb-1 block font-medium text-black">
              Descripción o motivo de anulación
            </label>

            <textarea
              value={descripcionAnulacion}
              onChange={(e) => setDescripcionAnulacion(e.target.value)}
              rows={5}
              placeholder="Ejemplo: Factura anulada por error en los datos del cliente o por sustitución de documento."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Este texto se mostrará en la factura impresa debajo de No. Registro SAG.
            </p>

            <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cerrarModalEstadoFactura}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-black hover:bg-gray-300"
              >
                Cancelar
              </button>

              {facturaSeleccionada.estado === 'Anulada' && (
                <button
                  type="button"
                  onClick={emitirFacturaDeNuevo}
                  disabled={guardandoAnulacion}
                  className="rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {guardandoAnulacion ? 'Guardando...' : 'Emitir de nuevo'}
                </button>
              )}

              <button
                type="button"
                onClick={guardarAnulacionFactura}
                disabled={guardandoAnulacion}
                className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {guardandoAnulacion ? 'Guardando...' : 'Guardar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAplicarAbierto && reciboSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 text-black shadow-2xl">
            <h3 className="mb-2 text-xl font-bold">Aplicar recibo</h3>

            <p className="mb-4 text-sm text-gray-600">
              Recibo: <strong>{reciboSeleccionado.secuencia_recibo}</strong> | Cliente:{' '}
              <strong>{reciboSeleccionado.nombre_cliente}</strong> | Valor:{' '}
              <strong>{moneda(reciboSeleccionado.valor_recibido)}</strong>
            </p>

            <label className="mb-1 block font-medium text-black">
              Descripción de aplicación del saldo
            </label>

            <textarea
              value={descripcionAplicacion}
              onChange={(e) => setDescripcionAplicacion(e.target.value)}
              rows={5}
              placeholder="Ejemplo: Este saldo se usó para pago de la factura 000-003-01-00000011."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Este texto se guardará en el recibo y deberá mostrarse en el recibo impreso.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModalAplicarRecibo}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-black hover:bg-gray-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarAplicacionRecibo}
                disabled={guardandoAplicacion}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {guardandoAplicacion ? 'Guardando...' : 'Guardar y aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
