
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type PestanaActiva = 'registros' | 'operaciones' | 'reportes'

export default function Home() {
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('registros')

  const [productos, setProductos] = useState<any[]>([])
  const [descripcionesExistentes, setDescripcionesExistentes] = useState<string[]>([])
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([])

  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockActual, setStockActual] = useState('')
  const [tipoImpuesto, setTipoImpuesto] = useState('ISV')
  const [fechaRegistro, setFechaRegistro] = useState('')

  const [descripcionOperacion, setDescripcionOperacion] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Entrada')
  const [cantidadOperacion, setCantidadOperacion] = useState('')
  const [fechaOperacion, setFechaOperacion] = useState('')

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]
    setFechaRegistro(hoy)
    setFechaOperacion(hoy)
    obtenerProductos()
  }, [])

  useEffect(() => {
    if (!descripcion.trim()) return

    const productoCoincidente = productos.find(
      (p) =>
        p.descripcion?.trim().toLowerCase() ===
        descripcion.trim().toLowerCase()
    )

    if (productoCoincidente) {
      setCategoria(productoCoincidente.categoria || '')
      setUnidadMedida(productoCoincidente.unidad_medida || '')
      setTipoImpuesto(Number(productoCoincidente.impuesto) === 0 ? 'Exento' : 'ISV')
      setFechaRegistro(productoCoincidente.fecha_registro || new Date().toISOString().split('T')[0])
    }
  }, [descripcion, productos])

  async function obtenerProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id_producto', { ascending: false })

    if (error) {
      console.log('Error al obtener productos:', error)
    } else {
      const lista = data || []
      setProductos(lista)

      const descripcionesUnicas = [...new Set(lista.map((p) => p.descripcion).filter(Boolean))]
      const categoriasUnicas = [...new Set(lista.map((p) => p.categoria).filter(Boolean))]

      setDescripcionesExistentes(descripcionesUnicas)
      setCategoriasExistentes(categoriasUnicas)
    }
  }

  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault()

    const descripcionLimpia = descripcion.trim()
    const categoriaLimpia = categoria.trim()
    const unidadMedidaLimpia = unidadMedida.trim()
    const impuestoValor = tipoImpuesto === 'Exento' ? 0 : 15

    const productoExistente = productos.find(
      (p) =>
        p.descripcion?.trim().toLowerCase() ===
        descripcionLimpia.toLowerCase()
    )

    if (productoExistente) {
      const { error } = await supabase
        .from('productos')
        .update({
          categoria: categoriaLimpia,
          unidad_medida: unidadMedidaLimpia,
          precio_compra: Number(precioCompra),
          precio_venta: Number(precioVenta),
          stock_actual: Number(stockActual),
          impuesto: impuestoValor,
          fecha_registro: fechaRegistro,
        })
        .eq('id_producto', productoExistente.id_producto)

      if (error) {
        console.log('Error al actualizar producto:', error)
        alert('Ocurrió un error al actualizar el producto existente')
      } else {
        alert('Producto existente actualizado correctamente')
        limpiarFormulario()
        obtenerProductos()
      }
    } else {
      const { error } = await supabase.from('productos').insert([
        {
          descripcion: descripcionLimpia,
          categoria: categoriaLimpia,
          unidad_medida: unidadMedidaLimpia,
          precio_compra: Number(precioCompra),
          precio_venta: Number(precioVenta),
          stock_actual: Number(stockActual),
          impuesto: impuestoValor,
          fecha_registro: fechaRegistro,
        },
      ])

      if (error) {
        console.log('Error al guardar producto:', error)
        alert('Ocurrió un error al guardar el producto')
      } else {
        alert('Producto nuevo guardado correctamente')
        limpiarFormulario()
        obtenerProductos()
      }
    }
  }

  async function guardarOperacionStock(e: React.FormEvent) {
    e.preventDefault()

    const descripcionLimpia = descripcionOperacion.trim()
    const cantidad = Number(cantidadOperacion)

    if (!descripcionLimpia) {
      alert('Debe seleccionar o escribir una descripción')
      return
    }

    if (!cantidad || cantidad <= 0) {
      alert('La cantidad debe ser mayor que 0')
      return
    }

    const productoExistente = productos.find(
      (p) =>
        p.descripcion?.trim().toLowerCase() ===
        descripcionLimpia.toLowerCase()
    )

    if (!productoExistente) {
      alert('La descripción ingresada no existe en el inventario')
      return
    }

    const stockActualNumero = Number(productoExistente.stock_actual) || 0
    let nuevoStock = stockActualNumero

    if (tipoOperacion === 'Entrada') {
      nuevoStock = stockActualNumero + cantidad
    } else {
      nuevoStock = stockActualNumero - cantidad

      if (nuevoStock < 0) {
        alert('No puede hacer una salida mayor al stock actual')
        return
      }
    }

    const { error } = await supabase
      .from('productos')
      .update({
        stock_actual: nuevoStock,
      })
      .eq('id_producto', productoExistente.id_producto)

    if (error) {
      console.log('Error al guardar operación de stock:', error)
      alert('Ocurrió un error al actualizar el stock')
      return
    }

    const { error: errorMovimiento } = await supabase
      .from('movimientos_inventario')
      .insert([
        {
          id_producto: productoExistente.id_producto,
          descripcion: productoExistente.descripcion,
          tipo_operacion: tipoOperacion,
          cantidad: cantidad,
          stock_anterior: stockActualNumero,
          stock_nuevo: nuevoStock,
          fecha_registro: fechaOperacion,
        },
      ])

    if (errorMovimiento) {
      console.log('Error al guardar movimiento:', errorMovimiento)
      alert('Se actualizó el stock, pero falló el registro del movimiento')
      return
    }

    alert('Stock actualizado correctamente')
    limpiarFormularioOperacion()
    obtenerProductos()
  }

  function limpiarFormulario() {
    const hoy = new Date().toISOString().split('T')[0]
    setDescripcion('')
    setCategoria('')
    setUnidadMedida('')
    setPrecioCompra('')
    setPrecioVenta('')
    setStockActual('')
    setTipoImpuesto('ISV')
    setFechaRegistro(hoy)
  }

  function limpiarFormularioOperacion() {
    const hoy = new Date().toISOString().split('T')[0]
    setDescripcionOperacion('')
    setTipoOperacion('Entrada')
    setCantidadOperacion('')
    setFechaOperacion(hoy)
  }

  async function eliminarProducto(id: number) {
    const confirmar = confirm('¿Desea eliminar este producto?')

    if (!confirmar) return

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', id)

    if (error) {
      console.log('Error al eliminar producto:', error)
      alert('Ocurrió un error al eliminar el producto')
    } else {
      alert('Producto eliminado correctamente')
      obtenerProductos()
    }
  }

  function estiloPestana(activa: boolean) {
    return {
      padding: '10px 18px',
      cursor: 'pointer',
      backgroundColor: activa ? '#088395' : '#0A4D68',
      color: '#FFFFFF',
      border: '1px solid #088395',
      borderRadius: '8px',
      fontWeight: 'bold' as const,
      marginRight: '10px',
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #061A40 0%, #0A4D68 60%, #088395 100%)',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <a
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontWeight: 'bold',
            backgroundColor: '#0A4D68',
            padding: '10px 16px',
            borderRadius: '8px',
          }}
        >
          ← Volver al dashboard
        </a>

        <h1 style={{ marginBottom: '10px' }}>Mini ERP Ferretería</h1>
        <h2 style={{ marginBottom: '20px' }}>Módulo Inventario</h2>

        <div style={{ marginBottom: '25px' }}>
          <button
            type="button"
            onClick={() => setPestanaActiva('registros')}
            style={estiloPestana(pestanaActiva === 'registros')}
          >
            Registros
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('operaciones')}
            style={estiloPestana(pestanaActiva === 'operaciones')}
          >
            Operaciones
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('reportes')}
            style={estiloPestana(pestanaActiva === 'reportes')}
          >
            Reportes
          </button>
        </div>

        {pestanaActiva === 'registros' && (
          <>
            <h2 style={{ marginBottom: '20px' }}>Registro de productos</h2>

            <form
              onSubmit={guardarProducto}
              style={{
                marginBottom: '30px',
                border: '1px solid #088395',
                backgroundColor: '#061A40',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label>Descripción:</label>
                <br />
                <input
                  type="text"
                  list="lista-descripciones"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  placeholder="Escriba o seleccione una descripción"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
                <datalist id="lista-descripciones">
                  {descripcionesExistentes.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Categoría:</label>
                <br />
                <input
                  type="text"
                  list="lista-categorias"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                  placeholder="Se autocompleta si la descripción ya existe"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
                <datalist id="lista-categorias">
                  {categoriasExistentes.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Unidad de medida:</label>
                <br />
                <input
                  type="text"
                  value={unidadMedida}
                  onChange={(e) => setUnidadMedida(e.target.value)}
                  required
                  placeholder="Se autocompleta si la descripción ya existe"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Precio compra:</label>
                <br />
                <input
                  type="number"
                  step="0.01"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Precio venta:</label>
                <br />
                <input
                  type="number"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Stock actual:</label>
                <br />
                <input
                  type="number"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Impuesto:</label>
                <br />
                <select
                  value={tipoImpuesto}
                  onChange={(e) => setTipoImpuesto(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                >
                  <option value="ISV">ISV (15%)</option>
                  <option value="Exento">Exento (0%)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Fecha de registro:</label>
                <br />
                <input
                  type="date"
                  value={fechaRegistro}
                  onChange={(e) => setFechaRegistro(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  backgroundColor: '#088395',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                Guardar producto
              </button>
            </form>

            <h2 style={{ marginBottom: '20px' }}>Listado de productos</h2>

            {productos.length === 0 ? (
              <p>No hay productos para mostrar.</p>
            ) : (
              productos.map((p) => (
                <div
                  key={p.id_producto}
                  style={{
                    backgroundColor: '#061A40',
                    border: '1px solid #088395',
                    padding: '16px',
                    marginBottom: '14px',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                  }}
                >
                  <strong style={{ fontSize: '18px' }}>{p.descripcion}</strong>
                  <br />
                  Categoría: {p.categoria}
                  <br />
                  Unidad: {p.unidad_medida}
                  <br />
                  Precio compra: L {p.precio_compra}
                  <br />
                  Precio venta: L {p.precio_venta}
                  <br />
                  Stock actual: {p.stock_actual}
                  <br />
                  Impuesto: {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}
                  <br />
                  Fecha registro: {p.fecha_registro || 'Sin fecha'}
                  <br />
                  <br />

                  <button
                    onClick={() => eliminarProducto(p.id_producto)}
                    style={{
                      padding: '8px 14px',
                      cursor: 'pointer',
                      backgroundColor: '#0A4D68',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {pestanaActiva === 'operaciones' && (
          <>
            <h2 style={{ marginBottom: '20px' }}>Operaciones de stock</h2>

            <form
              onSubmit={guardarOperacionStock}
              style={{
                marginBottom: '30px',
                border: '1px solid #088395',
                backgroundColor: '#061A40',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label>Descripción:</label>
                <br />
                <input
                  type="text"
                  list="lista-descripciones-operacion"
                  value={descripcionOperacion}
                  onChange={(e) => setDescripcionOperacion(e.target.value)}
                  required
                  placeholder="Seleccione una descripción existente"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
                <datalist id="lista-descripciones-operacion">
                  {descripcionesExistentes.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Tipo de operación:</label>
                <br />
                <select
                  value={tipoOperacion}
                  onChange={(e) => setTipoOperacion(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Cantidad:</label>
                <br />
                <input
                  type="number"
                  value={cantidadOperacion}
                  onChange={(e) => setCantidadOperacion(e.target.value)}
                  required
                  min="1"
                  placeholder="Ingrese la cantidad"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label>Fecha de operación:</label>
                <br />
                <input
                  type="date"
                  value={fechaOperacion}
                  onChange={(e) => setFechaOperacion(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0A4D68',
                    color: '#FFFFFF',
                    border: '1px solid #088395',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  backgroundColor: '#088395',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                Guardar
              </button>
            </form>
          </>
        )}

        {pestanaActiva === 'reportes' && (
          <>
            <h2 style={{ marginBottom: '20px' }}>Reporte de productos</h2>

            <div
              style={{
                border: '1px solid #088395',
                backgroundColor: '#061A40',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  color: '#FFFFFF',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0A4D68' }}>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Descripción</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Categoría</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Unidad</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Precio compra</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Precio venta</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Stock</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Impuesto</th>
                    <th style={{ border: '1px solid #088395', padding: '10px' }}>Fecha registro</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          border: '1px solid #088395',
                          padding: '12px',
                          textAlign: 'center',
                        }}
                      >
                        No hay productos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    productos.map((p) => (
                      <tr key={p.id_producto}>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>{p.descripcion}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>{p.categoria}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>{p.unidad_medida}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>L {p.precio_compra}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>L {p.precio_venta}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>{p.stock_actual}</td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>
                          {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}
                        </td>
                        <td style={{ border: '1px solid #088395', padding: '10px' }}>
                          {p.fecha_registro || 'Sin fecha'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}