'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id_cliente: number
  nombre_cliente: string
  rtn: string | null
  direccion: string | null
  correo: string | null
  telefono: string | null
  nombre_contacto: string | null
}

type Producto = {
  id_producto: number
  descripcion: string
  precio_venta: number | string | null
  stock_actual: number | null
  impuesto: number | string | null
}

type Correlativo = {
  id_correlativo: number
  secuencia_fiscal: string
  numero: number
}

type LineaFactura = {
  idFila: number
  id_producto: number | ''
  cantidad: number
  precio_unitario: number
  porcentaje_impuesto: number
  subtotal_linea: number
  monto_impuesto_linea: number
  total_linea: number
}

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function crearLineaVacia(idFila: number): LineaFactura {
  return {
    idFila,
    id_producto: '',
    cantidad: 1,
    precio_unitario: 0,
    porcentaje_impuesto: 0,
    subtotal_linea: 0,
    monto_impuesto_linea: 0,
    total_linea: 0,
  }
}

function recalcularLinea(linea: LineaFactura): LineaFactura {
  const cantidad = Number(linea.cantidad) || 0
  const precio = Number(linea.precio_unitario) || 0
  const porcentaje = Number(linea.porcentaje_impuesto) || 0

  const subtotal = cantidad * precio
  const impuestoMonto = subtotal * (porcentaje / 100)
  const total = subtotal + impuestoMonto

  return {
    ...linea,
    subtotal_linea: Number(subtotal.toFixed(2)),
    monto_impuesto_linea: Number(impuestoMonto.toFixed(2)),
    total_linea: Number(total.toFixed(2)),
  }
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

export default function FacturacionTab() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [correlativos, setCorrelativos] = useState<Correlativo[]>([])

  const [cargandoBase, setCargandoBase] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rtn, setRtn] = useState('')
  const [fechaFactura, setFechaFactura] = useState(hoyLocal())

  const [idCorrelativo, setIdCorrelativo] = useState<number | ''>('')
  const [secuenciaFiscal, setSecuenciaFiscal] = useState('')

  const [lineas, setLineas] = useState<LineaFactura[]>([crearLineaVacia(1)])

  useEffect(() => {
    cargarDatosBase()
  }, [])

  async function cargarDatosBase() {
    setCargandoBase(true)
    setMensaje('')

    try {
      const [clientesRes, productosRes, correlativosRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id_cliente, nombre_cliente, rtn, direccion, correo, telefono, nombre_contacto')
          .order('nombre_cliente', { ascending: true }),

        supabase
          .from('productos')
          .select('id_producto, descripcion, precio_venta, stock_actual, impuesto')
          .order('descripcion', { ascending: true }),

        supabase
          .from('correlativos_fiscales')
          .select('id_correlativo, secuencia_fiscal, numero')
          .eq('usado', false)
          .order('numero', { ascending: true }),
      ])

      if (clientesRes.error) throw clientesRes.error
      if (productosRes.error) throw productosRes.error
      if (correlativosRes.error) throw correlativosRes.error

      const clientesData = clientesRes.data || []
      const productosData = productosRes.data || []
      const correlativosData = correlativosRes.data || []

      setClientes(clientesData)
      setProductos(productosData)
      setCorrelativos(correlativosData)

      if (correlativosData.length > 0) {
        setIdCorrelativo(correlativosData[0].id_correlativo)
        setSecuenciaFiscal(correlativosData[0].secuencia_fiscal)
      } else {
        setIdCorrelativo('')
        setSecuenciaFiscal('')
      }
    } catch (error: any) {
      const mensajeError = obtenerMensajeError(error)
      console.log('Error al cargar datos base:', error)
      setMensaje(`Error al cargar datos base: ${mensajeError}`)
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
      setDireccion('')
      setCorreo('')
      setTelefono('')
      setRtn('')
      return
    }

    setIdCliente(encontrado.id_cliente)
    setDireccion(encontrado.direccion || '')
    setCorreo(encontrado.correo || '')
    setTelefono(encontrado.telefono || '')
    setRtn(encontrado.rtn || '')
  }

  function cambiarCorrelativo(e: ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value

    if (!valor) {
      setIdCorrelativo('')
      setSecuenciaFiscal('')
      return
    }

    const id = Number(valor)
    const correlativo = correlativos.find((c) => c.id_correlativo === id)

    setIdCorrelativo(id)
    setSecuenciaFiscal(correlativo?.secuencia_fiscal || '')
  }

  function cambiarProductoLinea(index: number, e: ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value

    setLineas((prev) => {
      const nuevas = [...prev]

      if (!valor) {
        nuevas[index] = recalcularLinea({
          ...nuevas[index],
          id_producto: '',
          cantidad: 1,
          precio_unitario: 0,
          porcentaje_impuesto: 0,
        })
        return nuevas
      }

      const idProducto = Number(valor)
      const producto = productos.find((p) => p.id_producto === idProducto)

      nuevas[index] = recalcularLinea({
        ...nuevas[index],
        id_producto: idProducto,
        precio_unitario: Number(producto?.precio_venta || 0),
        porcentaje_impuesto: Number(producto?.impuesto || 0),
      })

      return nuevas
    })
  }

  function cambiarCantidadLinea(index: number, e: ChangeEvent<HTMLInputElement>) {
    const valor = Number(e.target.value)

    setLineas((prev) => {
      const nuevas = [...prev]
      nuevas[index] = recalcularLinea({
        ...nuevas[index],
        cantidad: valor > 0 ? valor : 0,
      })
      return nuevas
    })
  }

  function cambiarPrecioLinea(index: number, e: ChangeEvent<HTMLInputElement>) {
    const valor = Number(e.target.value)

    setLineas((prev) => {
      const nuevas = [...prev]
      nuevas[index] = recalcularLinea({
        ...nuevas[index],
        precio_unitario: valor >= 0 ? valor : 0,
      })
      return nuevas
    })
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, crearLineaVacia(Date.now())])
  }

  function eliminarLinea(idFila: number) {
    setLineas((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((linea) => linea.idFila !== idFila)
    })
  }

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((acc, linea) => acc + Number(linea.subtotal_linea || 0), 0)
    const impuesto = lineas.reduce(
      (acc, linea) => acc + Number(linea.monto_impuesto_linea || 0),
      0
    )
    const total = subtotal + impuesto

    return {
      subtotal: Number(subtotal.toFixed(2)),
      impuesto: Number(impuesto.toFixed(2)),
      total: Number(total.toFixed(2)),
    }
  }, [lineas])

  async function guardarFactura() {
    setMensaje('')

    if (!idCliente) {
      setMensaje('Debe seleccionar un cliente existente. Si no existe, créelo en la pestaña Clientes.')
      return
    }

    if (!idCorrelativo || !secuenciaFiscal) {
      setMensaje('Debe seleccionar una secuencia fiscal disponible.')
      return
    }

    const lineasValidas = lineas.filter(
      (linea) => Number(linea.id_producto) > 0 && Number(linea.cantidad) > 0
    )

    if (lineasValidas.length === 0) {
      setMensaje('Debe agregar al menos una línea válida en la factura.')
      return
    }

    for (const linea of lineasValidas) {
      const producto = productos.find((p) => p.id_producto === Number(linea.id_producto))

      if (!producto) {
        setMensaje('Uno de los productos ya no existe en inventario.')
        return
      }

      const stockActual = Number(producto.stock_actual || 0)
      const cantidad = Number(linea.cantidad || 0)

      if (cantidad > stockActual) {
        setMensaje(`No hay stock suficiente para "${producto.descripcion}". Disponible: ${stockActual}.`)
        return
      }
    }

    setGuardando(true)

    try {
      const { data: facturaCreada, error: errorFactura } = await supabase
        .from('facturas')
        .insert([
          {
            id_cliente: idCliente,
            id_correlativo: Number(idCorrelativo),
            secuencia_fiscal: secuenciaFiscal,
            nombre_cliente: nombreCliente.trim(),
            direccion: direccion.trim() || null,
            correo: correo.trim() || null,
            telefono: telefono.trim() || null,
            rtn: rtn.trim() || null,
            fecha_factura: fechaFactura,
            subtotal: totales.subtotal,
            impuesto_total: totales.impuesto,
            total_factura: totales.total,
            estado: 'Emitida',
          },
        ])
        .select('id_factura')
        .single()

      if (errorFactura) throw errorFactura

      const idFactura = facturaCreada.id_factura

      const detalleFactura = lineasValidas.map((linea) => {
        const producto = productos.find((p) => p.id_producto === Number(linea.id_producto))

        return {
          id_factura: idFactura,
          id_producto: Number(linea.id_producto),
          descripcion_producto: producto?.descripcion || 'Producto',
          cantidad: Number(linea.cantidad),
          precio_unitario: Number(linea.precio_unitario),
          porcentaje_impuesto: Number(linea.porcentaje_impuesto),
          subtotal_linea: Number(linea.subtotal_linea),
          monto_impuesto_linea: Number(linea.monto_impuesto_linea),
          total_linea: Number(linea.total_linea),
        }
      })

      const { error: errorDetalle } = await supabase
        .from('factura_detalle')
        .insert(detalleFactura)

      if (errorDetalle) throw errorDetalle

      const { error: errorCorrelativo } = await supabase
        .from('correlativos_fiscales')
        .update({
          usado: true,
          fecha_asignacion: fechaFactura,
        })
        .eq('id_correlativo', Number(idCorrelativo))

      if (errorCorrelativo) throw errorCorrelativo

      for (const linea of lineasValidas) {
        const producto = productos.find((p) => p.id_producto === Number(linea.id_producto))
        if (!producto) continue

        const stockAnterior = Number(producto.stock_actual || 0)
        const cantidad = Number(linea.cantidad || 0)
        const stockNuevo = stockAnterior - cantidad

        const { error: errorUpdateProducto } = await supabase
          .from('productos')
          .update({
            stock_actual: stockNuevo,
          })
          .eq('id_producto', Number(linea.id_producto))

        if (errorUpdateProducto) throw errorUpdateProducto

        const { error: errorMovimiento } = await supabase
          .from('movimientos_inventario')
          .insert([
            {
              id_producto: Number(linea.id_producto),
              descripcion: producto.descripcion,
              tipo_operacion: `Salida por factura ${secuenciaFiscal}`,
              cantidad,
              stock_anterior: stockAnterior,
              stock_nuevo: stockNuevo,
              fecha_registro: fechaFactura,
            },
          ])

        if (errorMovimiento) throw errorMovimiento
      }

      setMensaje(`Factura creada correctamente con secuencia ${secuenciaFiscal}.`)

      window.open(`/clientes/factura/${idFactura}`, '_blank')

      setIdCliente(null)
      setNombreCliente('')
      setDireccion('')
      setCorreo('')
      setTelefono('')
      setRtn('')
      setFechaFactura(hoyLocal())
      setLineas([crearLineaVacia(1)])

      await cargarDatosBase()
    } catch (error: any) {
      const mensajeError = obtenerMensajeError(error)
      console.log('Error al crear factura:', error)
      setMensaje(`Error al crear factura: ${mensajeError}`)
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoBase) {
    return (
      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-6 text-gray-800 shadow-sm">
        Cargando datos de facturación...
      </div>
    )
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Facturación</h2>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
          <div>
            <label className="block mb-1 font-medium text-black">Nombre de cliente</label>
            <input
              type="text"
              list="clientes-existentes"
              value={nombreCliente}
              onChange={(e) => seleccionarClientePorNombre(e.target.value)}
              placeholder="Escriba o seleccione el cliente"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
            <datalist id="clientes-existentes">
              {clientes.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.nombre_cliente} />
              ))}
            </datalist>

            {!idCliente && nombreCliente.trim() !== '' && (
              <p className="text-xs text-amber-600 mt-2">
                Ese cliente no existe todavía. Créelo en la pestaña Clientes.
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-black">Fecha de factura</label>
            <input
              type="date"
              value={fechaFactura}
              onChange={(e) => setFechaFactura(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
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
            <label className="block mb-1 font-medium text-black">RTN</label>
            <input
              type="text"
              value={rtn}
              onChange={(e) => setRtn(e.target.value)}
              placeholder="RTN del cliente"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-black">Secuencia Fiscal</label>
            <select
              value={idCorrelativo}
              onChange={cambiarCorrelativo}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
            >
              <option value="">Seleccione una secuencia</option>
              {correlativos.map((correlativo) => (
                <option
                  key={correlativo.id_correlativo}
                  value={correlativo.id_correlativo}
                >
                  {correlativo.secuencia_fiscal}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="text-xl font-semibold mb-3 text-black">Detalle de la factura</h3>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-black">
                <th className="p-3 border border-gray-200">Producto</th>
                <th className="p-3 border border-gray-200">Cantidad</th>
                <th className="p-3 border border-gray-200">Precio</th>
                <th className="p-3 border border-gray-200">Impuesto</th>
                <th className="p-3 border border-gray-200">Subtotal</th>
                <th className="p-3 border border-gray-200">Acción</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, index) => {
                const productoSeleccionado = productos.find(
                  (p) => p.id_producto === Number(linea.id_producto)
                )
                const impuestoTexto =
                  Number(linea.porcentaje_impuesto) === 15 ? 'ISV 15%' : 'Exento'

                return (
                  <tr key={linea.idFila} className="bg-white text-black">
                    <td className="p-3 border border-gray-200">
                      <select
                        value={linea.id_producto}
                        onChange={(e) => cambiarProductoLinea(index, e)}
                        className="w-full rounded bg-white border border-gray-300 px-2 py-1 text-black"
                      >
                        <option value="">Seleccione un producto</option>
                        {productos.map((producto) => (
                          <option key={producto.id_producto} value={producto.id_producto}>
                            {producto.descripcion}
                          </option>
                        ))}
                      </select>

                      {productoSeleccionado && (
                        <p className="text-xs text-gray-500 mt-2">
                          Stock disponible: {productoSeleccionado.stock_actual ?? 0}
                        </p>
                      )}
                    </td>

                    <td className="p-3 border border-gray-200">
                      <input
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) => cambiarCantidadLinea(index, e)}
                        className="w-full rounded bg-white border border-gray-300 px-2 py-1 text-black"
                      />
                    </td>

                    <td className="p-3 border border-gray-200">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.precio_unitario}
                        onChange={(e) => cambiarPrecioLinea(index, e)}
                        className="w-full rounded bg-white border border-gray-300 px-2 py-1 text-black"
                      />
                    </td>

                    <td className="p-3 border border-gray-200">
                      <div className="rounded bg-gray-100 border border-gray-300 px-2 py-1 text-black">
                        {impuestoTexto}
                      </div>
                    </td>

                    <td className="p-3 border border-gray-200">
                      <div className="rounded bg-gray-100 border border-gray-300 px-2 py-1 text-black">
                        {moneda(linea.total_linea)}
                      </div>
                    </td>

                    <td className="p-3 border border-gray-200">
                      <button
                        onClick={() => eliminarLinea(linea.idFila)}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={agregarLinea}
          className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          Agregar línea
        </button>
      </div>

      {mensaje && (
        <div className="mb-6 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black shadow-sm">
          {mensaje}
        </div>
      )}

      <div className="max-w-md ml-auto bg-gray-50 rounded-2xl p-4 border border-gray-300 shadow-sm">
        <div className="flex justify-between mb-2 text-black">
          <span>Subtotal sin impuesto:</span>
          <span>{moneda(totales.subtotal)}</span>
        </div>
        <div className="flex justify-between mb-2 text-black">
          <span>Impuesto:</span>
          <span>{moneda(totales.impuesto)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 text-black">
          <span>Total factura:</span>
          <span>{moneda(totales.total)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={guardarFactura}
          disabled={guardando}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
        >
          {guardando ? 'Creando factura...' : 'Crear factura'}
        </button>
      </div>
    </div>
  )
}