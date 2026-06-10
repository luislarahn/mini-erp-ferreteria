'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type TipoImpuesto = 'Exento' | 'Exonerado' | 'ISV 15%' | 'ISV 18%'

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

type LineaCotizacion = {
  idFila: number
  id_producto: number | ''
  cantidad: number
  precio_unitario: number
  tipo_impuesto: TipoImpuesto
  porcentaje_impuesto: number
  subtotal_linea: number
  monto_impuesto_linea: number
  total_linea: number
}

type CotizacionesTabProps = {
  irACrearCliente?: () => void
}

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function obtenerPorcentajeImpuesto(tipoImpuesto: TipoImpuesto) {
  if (tipoImpuesto === 'ISV 15%') return 15
  if (tipoImpuesto === 'ISV 18%') return 18
  return 0
}

function crearLineaVacia(idFila: number): LineaCotizacion {
  return {
    idFila,
    id_producto: '',
    cantidad: 1,
    precio_unitario: 0,
    tipo_impuesto: 'ISV 15%',
    porcentaje_impuesto: 15,
    subtotal_linea: 0,
    monto_impuesto_linea: 0,
    total_linea: 0,
  }
}

function recalcularLinea(linea: LineaCotizacion): LineaCotizacion {
  const cantidad = Number(linea.cantidad) || 0
  const precio = Number(linea.precio_unitario) || 0
  const porcentaje = obtenerPorcentajeImpuesto(linea.tipo_impuesto)

  const subtotal = cantidad * precio
  const impuestoMonto = subtotal * (porcentaje / 100)
  const total = subtotal + impuestoMonto

  return {
    ...linea,
    porcentaje_impuesto: porcentaje,
    subtotal_linea: Number(subtotal.toFixed(2)),
    monto_impuesto_linea: Number(impuestoMonto.toFixed(2)),
    total_linea: Number(total.toFixed(2)),
  }
}

function moneda(valor: number | string | null | undefined) {
  return `L ${Number(valor || 0).toFixed(2)}`
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

export default function CotizacionesTab({ irACrearCliente }: CotizacionesTabProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [cargandoBase, setCargandoBase] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rtn, setRtn] = useState('')
  const [fechaCotizacion, setFechaCotizacion] = useState(hoyLocal())

  const [lineas, setLineas] = useState<LineaCotizacion[]>([crearLineaVacia(1)])

  useEffect(() => {
    cargarDatosBase()
  }, [])

  async function cargarDatosBase() {
    setCargandoBase(true)
    setMensaje('')

    try {
      const [clientesRes, productosRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id_cliente, nombre_cliente, rtn, direccion, correo, telefono, nombre_contacto')
          .order('nombre_cliente', { ascending: true }),

        supabase
          .from('productos')
          .select('id_producto, descripcion, precio_venta, stock_actual, impuesto')
          .order('descripcion', { ascending: true }),
      ])

      if (clientesRes.error) throw clientesRes.error
      if (productosRes.error) throw productosRes.error

      setClientes(clientesRes.data || [])
      setProductos(productosRes.data || [])
    } catch (error: any) {
      console.log('Error al cargar datos base de cotizaciones:', error)
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

  function detectarTipoImpuestoProducto(producto?: Producto): TipoImpuesto {
    const impuestoProducto = Number(producto?.impuesto || 0)

    if (impuestoProducto === 18) return 'ISV 18%'
    if (impuestoProducto === 15) return 'ISV 15%'
    if (impuestoProducto === 0) return 'Exento'

    return 'ISV 15%'
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
          tipo_impuesto: 'ISV 15%',
          porcentaje_impuesto: 15,
        })

        return nuevas
      }

      const idProducto = Number(valor)
      const producto = productos.find((p) => p.id_producto === idProducto)
      const tipoImpuesto = detectarTipoImpuestoProducto(producto)

      nuevas[index] = recalcularLinea({
        ...nuevas[index],
        id_producto: idProducto,
        precio_unitario: Number(producto?.precio_venta || 0),
        tipo_impuesto: tipoImpuesto,
        porcentaje_impuesto: obtenerPorcentajeImpuesto(tipoImpuesto),
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

  function cambiarTipoImpuestoLinea(index: number, e: ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value as TipoImpuesto

    setLineas((prev) => {
      const nuevas = [...prev]
      nuevas[index] = recalcularLinea({
        ...nuevas[index],
        tipo_impuesto: valor,
        porcentaje_impuesto: obtenerPorcentajeImpuesto(valor),
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

    const importeExonerado = lineas
      .filter((linea) => linea.tipo_impuesto === 'Exonerado')
      .reduce((acc, linea) => acc + Number(linea.subtotal_linea || 0), 0)

    const importeExento = lineas
      .filter((linea) => linea.tipo_impuesto === 'Exento')
      .reduce((acc, linea) => acc + Number(linea.subtotal_linea || 0), 0)

    const importeGravado15 = lineas
      .filter((linea) => linea.tipo_impuesto === 'ISV 15%')
      .reduce((acc, linea) => acc + Number(linea.subtotal_linea || 0), 0)

    const importeGravado18 = lineas
      .filter((linea) => linea.tipo_impuesto === 'ISV 18%')
      .reduce((acc, linea) => acc + Number(linea.subtotal_linea || 0), 0)

    const isv15 = lineas
      .filter((linea) => linea.tipo_impuesto === 'ISV 15%')
      .reduce((acc, linea) => acc + Number(linea.monto_impuesto_linea || 0), 0)

    const isv18 = lineas
      .filter((linea) => linea.tipo_impuesto === 'ISV 18%')
      .reduce((acc, linea) => acc + Number(linea.monto_impuesto_linea || 0), 0)

    const total = subtotal + isv15 + isv18
    const impuestoTotal = isv15 + isv18

    return {
      subtotal: Number(subtotal.toFixed(2)),
      importeExonerado: Number(importeExonerado.toFixed(2)),
      importeExento: Number(importeExento.toFixed(2)),
      importeGravado15: Number(importeGravado15.toFixed(2)),
      importeGravado18: Number(importeGravado18.toFixed(2)),
      isv15: Number(isv15.toFixed(2)),
      isv18: Number(isv18.toFixed(2)),
      impuestoTotal: Number(impuestoTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    }
  }, [lineas])

  async function generarNumeroCotizacion() {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('id_cotizacion')
      .order('id_cotizacion', { ascending: false })
      .limit(1)

    if (error) throw error

    const siguiente = data && data.length > 0 ? Number(data[0].id_cotizacion) + 1 : 1
    return `COT-${String(siguiente).padStart(6, '0')}`
  }

  async function guardarCotizacion() {
    setMensaje('')

    if (!idCliente) {
      setMensaje('Debe seleccionar un cliente existente. Si no existe, créelo en la pestaña Clientes.')
      return
    }

    const lineasValidas = lineas.filter(
      (linea) => Number(linea.id_producto) > 0 && Number(linea.cantidad) > 0
    )

    if (lineasValidas.length === 0) {
      setMensaje('Debe agregar al menos un producto en la cotización.')
      return
    }

    setGuardando(true)

    try {
      const numeroCotizacion = await generarNumeroCotizacion()

      const { data: cotizacionCreada, error: errorCotizacion } = await supabase
        .from('cotizaciones')
        .insert([
          {
            numero_cotizacion: numeroCotizacion,
            id_cliente: idCliente,
            nombre_cliente: nombreCliente.trim(),
            direccion: direccion.trim() || null,
            correo: correo.trim() || null,
            telefono: telefono.trim() || null,
            rtn: rtn.trim() || null,
            fecha_cotizacion: fechaCotizacion,
            subtotal: totales.subtotal,
            importe_exonerado: totales.importeExonerado,
            importe_exento: totales.importeExento,
            importe_gravado_15: totales.importeGravado15,
            importe_gravado_18: totales.importeGravado18,
            isv_15: totales.isv15,
            isv_18: totales.isv18,
            impuesto_total: totales.impuestoTotal,
            total_cotizacion: totales.total,
            estado: 'Activa',
          },
        ])
        .select('id_cotizacion')
        .single()

      if (errorCotizacion) throw errorCotizacion

      const idCotizacion = cotizacionCreada.id_cotizacion

      const detalleCotizacion = lineasValidas.map((linea) => {
        const producto = productos.find((p) => p.id_producto === Number(linea.id_producto))

        return {
          id_cotizacion: idCotizacion,
          id_producto: Number(linea.id_producto),
          descripcion_producto: producto?.descripcion || 'Producto',
          cantidad: Number(linea.cantidad),
          precio_unitario: Number(linea.precio_unitario),
          tipo_impuesto: linea.tipo_impuesto,
          porcentaje_impuesto: Number(linea.porcentaje_impuesto),
          subtotal_linea: Number(linea.subtotal_linea),
          monto_impuesto_linea: Number(linea.monto_impuesto_linea),
          total_linea: Number(linea.total_linea),
        }
      })

      const { error: errorDetalle } = await supabase
        .from('detalle_cotizacion')
        .insert(detalleCotizacion)

      if (errorDetalle) throw errorDetalle

      window.open(`/clientes/cotizacion/${idCotizacion}`, '_blank')

      setMensaje(`Cotización creada correctamente: ${numeroCotizacion}`)
      setIdCliente(null)
      setNombreCliente('')
      setDireccion('')
      setCorreo('')
      setTelefono('')
      setRtn('')
      setFechaCotizacion(hoyLocal())
      setLineas([crearLineaVacia(1)])
    } catch (error: any) {
      console.log('Error al crear cotización:', error)
      setMensaje(`Error al crear cotización: ${obtenerMensajeError(error)}`)
    } finally {
      setGuardando(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontWeight: 'bold' as const,
    marginBottom: '6px',
    fontSize: '14px',
    color: '#374151',
  }

  const botonPrincipal = {
    backgroundColor: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 18px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    fontSize: '14px',
  }

  const botonSecundario = {
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    fontSize: '14px',
  }

  if (cargandoBase) {
    return <p>Cargando cotizaciones...</p>
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Cotizaciones</h2>
        <p style={{ marginTop: '6px', color: '#6B7280' }}>
          Cree cotizaciones para clientes sin generar secuencia fiscal ni afectar inventario.
        </p>
      </div>

      {mensaje && (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor:
              mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('debe')
                ? '#FEF2F2'
                : '#ECFDF5',
            color:
              mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('debe')
                ? '#991B1B'
                : '#065F46',
            border:
              mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('debe')
                ? '1px solid #FECACA'
                : '1px solid #A7F3D0',
            fontWeight: 'bold',
          }}
        >
          {mensaje}
        </div>
      )}

      <section
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '20px',
          marginBottom: '22px',
          backgroundColor: '#F9FAFB',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Datos del cliente</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Cliente</label>
            <input
              list="lista-clientes-cotizaciones"
              value={nombreCliente}
              onChange={(e) => seleccionarClientePorNombre(e.target.value)}
              placeholder="Seleccione o escriba el cliente"
              style={inputStyle}
            />
            <datalist id="lista-clientes-cotizaciones">
              {clientes.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.nombre_cliente} />
              ))}
            </datalist>
          </div>

          <div>
            <label style={labelStyle}>Fecha de cotización</label>
            <input
              type="date"
              value={fechaCotizacion}
              onChange={(e) => setFechaCotizacion(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>RTN</label>
            <input value={rtn} onChange={(e) => setRtn(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Teléfono</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Correo</label>
            <input value={correo} onChange={(e) => setCorreo(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Dirección</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {irACrearCliente && (
          <button type="button" onClick={irACrearCliente} style={{ ...botonSecundario, marginTop: '16px' }}>
            Crear cliente nuevo
          </button>
        )}
      </section>

      <section
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '20px',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0 }}>Detalle de productos</h3>
          <button type="button" onClick={agregarLinea} style={botonSecundario}>
            + Agregar línea
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB', textAlign: 'left' }}>Producto</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Stock</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Cantidad</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Precio</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Impuesto</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Subtotal</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Total</th>
                <th style={{ padding: '10px', border: '1px solid #E5E7EB' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, index) => {
                const productoSeleccionado = productos.find((p) => p.id_producto === Number(linea.id_producto))

                return (
                  <tr key={linea.idFila}>
                    <td style={{ padding: '8px', border: '1px solid #E5E7EB' }}>
                      <select
                        value={linea.id_producto}
                        onChange={(e) => cambiarProductoLinea(index, e)}
                        style={inputStyle}
                      >
                        <option value="">Seleccione producto</option>
                        {productos.map((producto) => (
                          <option key={producto.id_producto} value={producto.id_producto}>
                            {producto.descripcion}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                      {productoSeleccionado?.stock_actual ?? '-'}
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB' }}>
                      <input
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) => cambiarCantidadLinea(index, e)}
                        style={inputStyle}
                      />
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.precio_unitario}
                        onChange={(e) => cambiarPrecioLinea(index, e)}
                        style={inputStyle}
                      />
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB' }}>
                      <select
                        value={linea.tipo_impuesto}
                        onChange={(e) => cambiarTipoImpuestoLinea(index, e)}
                        style={inputStyle}
                      >
                        <option value="ISV 15%">ISV 15%</option>
                        <option value="ISV 18%">ISV 18%</option>
                        <option value="Exento">Exento</option>
                        <option value="Exonerado">Exonerado</option>
                      </select>
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB', textAlign: 'right' }}>
                      {moneda(linea.subtotal_linea)}
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB', textAlign: 'right' }}>
                      {moneda(linea.total_linea)}
                    </td>

                    <td style={{ padding: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                      <button type="button" onClick={() => eliminarLinea(linea.idFila)} style={botonSecundario}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '22px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            border: '1px solid #E5E7EB',
            borderRadius: '18px',
            padding: '18px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Importe exonerado:</span>
            <strong>{moneda(totales.importeExonerado)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Importe exento:</span>
            <strong>{moneda(totales.importeExento)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Importe gravado 15%:</span>
            <strong>{moneda(totales.importeGravado15)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Importe gravado 18%:</span>
            <strong>{moneda(totales.importeGravado18)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>ISV 15%:</span>
            <strong>{moneda(totales.isv15)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>ISV 18%:</span>
            <strong>{moneda(totales.isv18)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D1D5DB', paddingTop: '10px', marginTop: '10px', fontSize: '20px' }}>
            <span>Total cotización:</span>
            <strong>{moneda(totales.total)}</strong>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={() => {
            setIdCliente(null)
            setNombreCliente('')
            setDireccion('')
            setCorreo('')
            setTelefono('')
            setRtn('')
            setFechaCotizacion(hoyLocal())
            setLineas([crearLineaVacia(1)])
            setMensaje('')
          }}
          style={botonSecundario}
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={guardarCotizacion}
          disabled={guardando}
          style={{
            ...botonPrincipal,
            opacity: guardando ? 0.65 : 1,
            cursor: guardando ? 'not-allowed' : 'pointer',
          }}
        >
          {guardando ? 'Creando cotización...' : 'Crear cotización'}
        </button>
      </div>
    </div>
  )
}



