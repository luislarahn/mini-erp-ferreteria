'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id_cliente: number
  nombre_cliente: string
  direccion: string | null
  telefono: string | null
  correo: string | null
}

type RecibosTabProps = {
  irACrearCliente?: () => void
}

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function obtenerAnioCorto(fecha: string) {
  return new Date(`${fecha}T00:00:00`).getFullYear().toString().slice(-2)
}

function obtenerAnioNumero(fecha: string) {
  return new Date(`${fecha}T00:00:00`).getFullYear()
}

function moneda(valor: number) {
  return `L ${valor.toFixed(2)}`
}

function construirSecuenciaRecibo(anioCorto: string, correlativo: number) {
  return `RP${anioCorto}${String(correlativo).padStart(4, '0')}`
}

function obtenerMensajeError(error: any) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (error.details) return error.details
  if (error.hint) return error.hint

  try {
    return JSON.stringify(error)
  } catch {
    return 'Ocurrió un error inesperado.'
  }
}

export default function RecibosTab({ irACrearCliente }: RecibosTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [fechaRecibo, setFechaRecibo] = useState(hoyLocal())
  const [descripcion, setDescripcion] = useState('')
  const [valorRecibido, setValorRecibido] = useState('')
  const [secuenciaRecibo, setSecuenciaRecibo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const total = Number(valorRecibido) || 0

  useEffect(() => {
    cargarClientes()
  }, [])

  useEffect(() => {
    cargarSiguienteSecuencia()
  }, [fechaRecibo])

  async function cargarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id_cliente, nombre_cliente, direccion, telefono, correo')
      .order('nombre_cliente', { ascending: true })

    if (error) {
      console.log('Error al cargar clientes:', error)
      setMensaje(`Error al cargar clientes: ${obtenerMensajeError(error)}`)
      return
    }

    setClientes(data || [])
  }

  async function cargarSiguienteSecuencia() {
    const anio = obtenerAnioNumero(fechaRecibo)
    const anioCorto = obtenerAnioCorto(fechaRecibo)

    const { data, error } = await supabase
      .from('recibos_pago')
      .select('correlativo')
      .eq('anio', anio)
      .order('correlativo', { ascending: false })
      .limit(1)

    if (error) {
      console.log('Error al obtener correlativo de recibos:', error)
      setSecuenciaRecibo(construirSecuenciaRecibo(anioCorto, 1))
      return
    }

    const ultimoCorrelativo = data && data.length > 0 ? Number(data[0].correlativo) : 0
    const siguiente = ultimoCorrelativo + 1

    setSecuenciaRecibo(construirSecuenciaRecibo(anioCorto, siguiente))
  }

  function seleccionarClientePorNombre(valor: string) {
    setNombreCliente(valor)

    const encontrado = clientes.find(
      (c) => c.nombre_cliente.trim().toLowerCase() === valor.trim().toLowerCase()
    )

    if (!encontrado) {
      setIdCliente(null)
      setDireccion('')
      setTelefono('')
      setCorreo('')
      return
    }

    setIdCliente(encontrado.id_cliente)
    setDireccion(encontrado.direccion || '')
    setTelefono(encontrado.telefono || '')
    setCorreo(encontrado.correo || '')
  }

  function limpiarFormulario() {
    setIdCliente(null)
    setNombreCliente('')
    setDireccion('')
    setTelefono('')
    setCorreo('')
    setFechaRecibo(hoyLocal())
    setDescripcion('')
    setValorRecibido('')
  }

  async function guardarRecibo(e: React.FormEvent) {
    e.preventDefault()
    setMensaje('')

    if (!idCliente) {
      setMensaje('Debe seleccionar un cliente existente. Si no existe, créelo en la pestaña Clientes.')
      return
    }

    if (!nombreCliente.trim()) {
      setMensaje('Debe ingresar el nombre del cliente.')
      return
    }

    if (!descripcion.trim()) {
      setMensaje('Debe ingresar la descripción o concepto del recibo.')
      return
    }

    if (!total || total <= 0) {
      setMensaje('El valor recibido debe ser mayor que cero.')
      return
    }

    setGuardando(true)

    try {
      const anio = obtenerAnioNumero(fechaRecibo)
      const anioCorto = obtenerAnioCorto(fechaRecibo)

      const { data: ultimoRecibo, error: errorUltimo } = await supabase
        .from('recibos_pago')
        .select('correlativo')
        .eq('anio', anio)
        .order('correlativo', { ascending: false })
        .limit(1)

      if (errorUltimo) throw errorUltimo

      const ultimoCorrelativo =
        ultimoRecibo && ultimoRecibo.length > 0 ? Number(ultimoRecibo[0].correlativo) : 0

      const correlativo = ultimoCorrelativo + 1
      const secuencia = construirSecuenciaRecibo(anioCorto, correlativo)

      const { data: reciboCreado, error } = await supabase
        .from('recibos_pago')
        .insert([
          {
            id_cliente: idCliente,
            secuencia_recibo: secuencia,
            anio,
            correlativo,
            nombre_cliente: nombreCliente.trim(),
            direccion: direccion.trim() || null,
            telefono: telefono.trim() || null,
            correo: correo.trim() || null,
            fecha_recibo: fechaRecibo,
            descripcion: descripcion.trim(),
            valor_recibido: total,
            estado: 'Emitido',
          },
        ])
        .select('id_recibo, secuencia_recibo')
        .single()

      if (error) throw error

      setMensaje(`Recibo creado correctamente con secuencia ${reciboCreado.secuencia_recibo}.`)

      window.open(`/clientes/recibo/${reciboCreado.id_recibo}`, '_blank')

      limpiarFormulario()
      await cargarSiguienteSecuencia()
    } catch (error: any) {
      console.log('Error al guardar recibo:', error)
      setMensaje(`Error al guardar recibo: ${obtenerMensajeError(error)}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Recibos</h2>

      <form
        onSubmit={guardarRecibo}
        className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-black">Nombre de cliente</label>
            <input
              type="text"
              list="clientes-recibos-existentes"
              value={nombreCliente}
              onChange={(e) => seleccionarClientePorNombre(e.target.value)}
              placeholder="Escriba o seleccione el cliente"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              required
            />
            <datalist id="clientes-recibos-existentes">
              {clientes.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.nombre_cliente} />
              ))}
            </datalist>

            {!idCliente && nombreCliente.trim() !== '' && (
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xs text-amber-600">
                  Ese cliente no existe todavía.
                </p>

                <button
                  type="button"
                  onClick={irACrearCliente}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Crear
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Fecha</label>
            <input
              type="date"
              value={fechaRecibo}
              onChange={(e) => setFechaRecibo(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección del cliente"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="9999-9999"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Secuencia interna</label>
            <input
              type="text"
              value={secuenciaRecibo}
              readOnly
              className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-black cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-black">Detalle del recibo</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium text-black">Descripción / concepto</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ejemplo: Pago realizado de más en factura, anticipo, abono u otro concepto."
                className="w-full min-h-[90px] rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Valor recibido</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorRecibido}
                onChange={(e) => setValorRecibido(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
                required
              />

              <div className="mt-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
                <div className="flex justify-between text-black">
                  <span>Total recibido:</span>
                  <strong>{moneda(total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {mensaje && (
          <div className="mt-6 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black shadow-sm">
            {mensaje}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar recibo'}
          </button>
        </div>
      </form>
    </div>
  )
}
