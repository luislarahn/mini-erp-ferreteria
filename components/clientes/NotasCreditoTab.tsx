'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id_cliente: number
  nombre_cliente: string
  rtn: string | null
  direccion: string | null
  telefono: string | null
  correo: string | null
}

type Correlativo = {
  id_correlativo: number
  secuencia_fiscal: string
  numero: number
  tipo_documento?: string | null
}

type NotasCreditoTabProps = {
  irACrearCliente?: () => void
}

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function moneda(valor: number) {
  return `L ${valor.toFixed(2)}`
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

export default function NotasCreditoTab({ irACrearCliente }: NotasCreditoTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [correlativos, setCorrelativos] = useState<Correlativo[]>([])

  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [rtn, setRtn] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [fechaNota, setFechaNota] = useState(hoyLocal())
  const [descripcion, setDescripcion] = useState('')
  const [valorNota, setValorNota] = useState('')

  const [idCorrelativo, setIdCorrelativo] = useState<number | ''>('')
  const [secuenciaFiscal, setSecuenciaFiscal] = useState('')

  const [cargandoBase, setCargandoBase] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const total = Number(valorNota) || 0

  useEffect(() => {
    cargarDatosBase()
  }, [])

  async function cargarDatosBase() {
    setCargandoBase(true)
    setMensaje('')

    try {
      const [clientesRes, correlativosRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id_cliente, nombre_cliente, rtn, direccion, telefono, correo')
          .order('nombre_cliente', { ascending: true }),

        supabase
          .from('correlativos_fiscales')
          .select(`
            id_correlativo,
            secuencia_fiscal,
            numero,
            tipo_documento,
            autorizaciones_fiscales!inner (
              id_autorizacion,
              activo,
              fecha_expiracion
            )
          `)
          .eq('usado', false)
          .eq('tipo_documento', 'nota_credito')
          .eq('autorizaciones_fiscales.activo', true)
          .gte('autorizaciones_fiscales.fecha_expiracion', hoyLocal())
          .order('numero', { ascending: true }),
      ])

      if (clientesRes.error) throw clientesRes.error
      if (correlativosRes.error) throw correlativosRes.error

      const clientesData = clientesRes.data || []
      const correlativosData = (correlativosRes.data || []) as Correlativo[]

      setClientes(clientesData)
      setCorrelativos(correlativosData)

      if (correlativosData.length > 0) {
        setIdCorrelativo(correlativosData[0].id_correlativo)
        setSecuenciaFiscal(correlativosData[0].secuencia_fiscal)
      } else {
        setIdCorrelativo('')
        setSecuenciaFiscal('')
      }
    } catch (error: any) {
      console.log('Error al cargar datos base de notas de crédito:', error)
      setMensaje(`Error al cargar datos base: ${obtenerMensajeError(error)}`)
    } finally {
      setCargandoBase(false)
    }
  }

  function seleccionarClientePorNombre(valor: string) {
    setNombreCliente(valor)

    const encontrado = clientes.find(
      (c) => c.nombre_cliente.trim().toLowerCase() === valor.trim().toLowerCase()
    )

    if (!encontrado) {
      setIdCliente(null)
      setRtn('')
      setDireccion('')
      setTelefono('')
      setCorreo('')
      return
    }

    setIdCliente(encontrado.id_cliente)
    setRtn(encontrado.rtn || '')
    setDireccion(encontrado.direccion || '')
    setTelefono(encontrado.telefono || '')
    setCorreo(encontrado.correo || '')
  }

  function limpiarFormulario() {
    setIdCliente(null)
    setNombreCliente('')
    setRtn('')
    setDireccion('')
    setTelefono('')
    setCorreo('')
    setFechaNota(hoyLocal())
    setDescripcion('')
    setValorNota('')
  }

  async function guardarNotaCredito(e: React.FormEvent) {
    e.preventDefault()
    setMensaje('')

    if (!idCliente) {
      setMensaje('Debe seleccionar un cliente existente. Si no existe, créelo en la pestaña Clientes.')
      return
    }

    if (!idCorrelativo || !secuenciaFiscal) {
      setMensaje('No hay correlativos fiscales disponibles para notas de crédito. Cree o active una autorización fiscal de Nota de Crédito.')
      return
    }

    if (!descripcion.trim()) {
      setMensaje('Debe ingresar la descripción o concepto de la nota de crédito.')
      return
    }

    if (!total || total <= 0) {
      setMensaje('El valor de la nota de crédito debe ser mayor que cero.')
      return
    }

    setGuardando(true)

    try {
      const correlativoActual = correlativos[0]

      if (!correlativoActual) {
        setMensaje('No hay correlativos fiscales disponibles para notas de crédito.')
        setGuardando(false)
        return
      }

      const { data: notaCreada, error: errorNota } = await supabase
        .from('notas_credito')
        .insert([
          {
            id_cliente: idCliente,
            id_correlativo: correlativoActual.id_correlativo,
            secuencia_fiscal: correlativoActual.secuencia_fiscal,
            nombre_cliente: nombreCliente.trim(),
            rtn: rtn.trim() || null,
            direccion: direccion.trim() || null,
            telefono: telefono.trim() || null,
            correo: correo.trim() || null,
            fecha_nota: fechaNota,
            descripcion: descripcion.trim(),
            valor_nota: total,
            estado: 'Emitida',
          },
        ])
        .select('id_nota_credito, secuencia_fiscal')
        .single()

      if (errorNota) throw errorNota

      const { error: errorCorrelativo } = await supabase
        .from('correlativos_fiscales')
        .update({
          usado: true,
          fecha_asignacion: fechaNota,
        })
        .eq('id_correlativo', correlativoActual.id_correlativo)

      if (errorCorrelativo) throw errorCorrelativo

      setMensaje(`Nota de crédito creada correctamente con número ${notaCreada.secuencia_fiscal}.`)

      window.open(`/clientes/nota-credito/${notaCreada.id_nota_credito}`, '_blank')

      limpiarFormulario()
      await cargarDatosBase()
    } catch (error: any) {
      console.log('Error al guardar nota de crédito:', error)
      setMensaje(`Error al guardar nota de crédito: ${obtenerMensajeError(error)}`)
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoBase) {
    return (
      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-6 text-gray-800 shadow-sm">
        Cargando datos de notas de crédito...
      </div>
    )
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Notas de Crédito</h2>

      <form
        onSubmit={guardarNotaCredito}
        className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-black">Nombre de cliente</label>
            <input
              type="text"
              list="clientes-notas-credito"
              value={nombreCliente}
              onChange={(e) => seleccionarClientePorNombre(e.target.value)}
              placeholder="Escriba o seleccione el cliente"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              required
            />
            <datalist id="clientes-notas-credito">
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
              value={fechaNota}
              onChange={(e) => setFechaNota(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">RTN</label>
            <input
              type="text"
              value={rtn}
              onChange={(e) => setRtn(e.target.value)}
              placeholder="RTN del cliente"
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
            <label className="block mb-1 font-medium text-black">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-black">Secuencia fiscal</label>
            <input
              type="text"
              value={secuenciaFiscal || 'No hay secuencias fiscales disponibles para notas de crédito'}
              readOnly
              className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-black cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-black">Detalle de la nota de crédito</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium text-black">Descripción / concepto</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ejemplo: Devolución, descuento, ajuste de factura, reversión parcial u otro concepto."
                className="w-full min-h-[90px] rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Valor de la nota</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorNota}
                onChange={(e) => setValorNota(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
                required
              />

              <div className="mt-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
                <div className="flex justify-between text-black">
                  <span>Total nota:</span>
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
            {guardando ? 'Guardando...' : 'Guardar nota de crédito'}
          </button>
        </div>
      </form>
    </div>
  )
}
