'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type PestanaActiva = 'registros' | 'operaciones' | 'reportes'
type VistaProductos = 'kanban' | 'lista'

export default function InventarioPage() {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('registros')
  const [vistaProductos, setVistaProductos] = useState<VistaProductos>('kanban')

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
    const auth = localStorage.getItem('miniERPAuth')
    if (auth !== 'true') {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    function manejarClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false)
      }
    }

    document.addEventListener('mousedown', manejarClickFuera)
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera)
    }
  }, [])

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
      setFechaRegistro(
        productoCoincidente.fecha_registro || new Date().toISOString().split('T')[0]
      )
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

      const descripcionesUnicas = [
        ...new Set(lista.map((p) => p.descripcion).filter(Boolean)),
      ]
      const categoriasUnicas = [
        ...new Set(lista.map((p) => p.categoria).filter(Boolean)),
      ]

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

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }

  function estiloPestana(activa: boolean) {
    return {
      padding: '11px 18px',
      cursor: 'pointer',
      backgroundColor: activa ? '#0F766E' : '#FFFFFF',
      color: activa ? '#FFFFFF' : '#374151',
      border: `1px solid ${activa ? '#0F766E' : '#E5E7EB'}`,
      borderRadius: '12px',
      fontWeight: 'bold' as const,
      marginRight: '10px',
      boxShadow: activa
        ? '0 8px 18px rgba(15,118,110,0.18)'
        : '0 2px 6px rgba(0,0,0,0.03)',
    }
  }

  function estiloVista(activa: boolean) {
    return {
      padding: '10px 14px',
      cursor: 'pointer',
      backgroundColor: activa ? '#0F766E' : '#FFFFFF',
      color: activa ? '#FFFFFF' : '#374151',
      border: `1px solid ${activa ? '#0F766E' : '#E5E7EB'}`,
      borderRadius: '10px',
      fontWeight: 'bold' as const,
      fontSize: '13px',
      marginLeft: '8px',
    }
  }

  const estiloInput = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    border: '1px solid #D1D5DB',
    borderRadius: '12px',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  }

  const estiloLabel = {
    display: 'block',
    marginBottom: '6px',
    color: '#374151',
    fontWeight: 600,
    fontSize: '14px',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        fontFamily: 'Arial, sans-serif',
        color: '#1F2937',
      }}
    >
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '20px 32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#0F172A',
                lineHeight: 1.1,
              }}
            >
              Ferretería PROIS
            </h1>
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '14px',
                color: '#6B7280',
                fontStyle: 'italic',
              }}
            >
              “Todo para construir con confianza.”
            </p>
          </div>

          <div
            ref={menuRef}
            style={{
              position: 'relative',
            }}
          >
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 8px 18px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                A
              </span>
              Admin
              <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
            </button>

            {menuAbierto && (
              <div
                style={{
                  position: 'absolute',
                  top: '58px',
                  right: 0,
                  width: '220px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  boxShadow: '0 18px 35px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: '#111827',
                      fontSize: '14px',
                    }}
                  >
                    Admin
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '4px',
                    }}
                  >
                    Usuario del sistema
                  </div>
                </div>

                <Link
                  href="/documentacion"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Documentación
                </Link>

                <Link
                  href="/soporte"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Soporte
                </Link>

                <Link
                  href="/preferencias"
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onClick={() => setMenuAbierto(false)}
                >
                  Preferencias
                </Link>

                <button
                  onClick={cerrarSesion}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '13px 16px',
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#B91C1C',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px',
        }}
      >
        <a
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            color: '#374151',
            textDecoration: 'none',
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          ← Volver al dashboard
        </a>

        <div style={{ marginBottom: '22px' }}>
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
            <div
              style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '24px',
                padding: '28px',
                marginBottom: '24px',
                boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>
                Registro de productos
              </h2>

              <form onSubmit={guardarProducto}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '18px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>Descripción</label>
                    <input
                      type="text"
                      list="lista-descripciones"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      required
                      placeholder="Escriba o seleccione una descripción"
                      style={estiloInput}
                    />
                    <datalist id="lista-descripciones">
                      {descripcionesExistentes.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={estiloLabel}>Categoría</label>
                    <input
                      type="text"
                      list="lista-categorias"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      required
                      placeholder="Se autocompleta si la descripción ya existe"
                      style={estiloInput}
                    />
                    <datalist id="lista-categorias">
                      {categoriasExistentes.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={estiloLabel}>Unidad de medida</label>
                    <input
                      type="text"
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      required
                      placeholder="Unidad"
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Precio compra</label>
                    <input
                      type="number"
                      step="0.01"
                      value={precioCompra}
                      onChange={(e) => setPrecioCompra(e.target.value)}
                      required
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Precio venta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      required
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Stock actual</label>
                    <input
                      type="number"
                      value={stockActual}
                      onChange={(e) => setStockActual(e.target.value)}
                      required
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Impuesto</label>
                    <select
                      value={tipoImpuesto}
                      onChange={(e) => setTipoImpuesto(e.target.value)}
                      required
                      style={estiloInput}
                    >
                      <option value="ISV">ISV (15%)</option>
                      <option value="Exento">Exento (0%)</option>
                    </select>
                  </div>

                  <div>
                    <label style={estiloLabel}>Fecha de registro</label>
                    <input
                      type="date"
                      value={fechaRegistro}
                      onChange={(e) => setFechaRegistro(e.target.value)}
                      required
                      style={estiloInput}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '22px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 22px',
                      cursor: 'pointer',
                      backgroundColor: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      boxShadow: '0 8px 18px rgba(15,118,110,0.18)',
                    }}
                  >
                    Guardar producto
                  </button>
                </div>
              </form>
            </div>

            <div
              style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ margin: 0, color: '#111827' }}>
                  Listado de productos
                </h2>

                <div>
                  <button
                    type="button"
                    onClick={() => setVistaProductos('kanban')}
                    style={estiloVista(vistaProductos === 'kanban')}
                  >
                    Kanban
                  </button>

                  <button
                    type="button"
                    onClick={() => setVistaProductos('lista')}
                    style={estiloVista(vistaProductos === 'lista')}
                  >
                    Lista
                  </button>
                </div>
              </div>

              {productos.length === 0 ? (
                <p style={{ color: '#6B7280' }}>No hay productos para mostrar.</p>
              ) : vistaProductos === 'kanban' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '18px',
                  }}
                >
                  {productos.map((p) => (
                    <div
                      key={p.id_producto}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        padding: '20px',
                        borderRadius: '20px',
                        color: '#111827',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                      }}
                    >
                      <strong style={{ fontSize: '18px', display: 'block', marginBottom: '12px' }}>
                        {p.descripcion}
                      </strong>

                      <div style={{ color: '#4B5563', lineHeight: 1.8, fontSize: '14px' }}>
                        <div><strong>Categoría:</strong> {p.categoria}</div>
                        <div><strong>Unidad:</strong> {p.unidad_medida}</div>
                        <div><strong>Precio compra:</strong> L {p.precio_compra}</div>
                        <div><strong>Precio venta:</strong> L {p.precio_venta}</div>
                        <div><strong>Stock actual:</strong> {p.stock_actual}</div>
                        <div><strong>Impuesto:</strong> {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}</div>
                        <div><strong>Fecha registro:</strong> {p.fecha_registro || 'Sin fecha'}</div>
                      </div>

                      <button
                        onClick={() => eliminarProducto(p.id_producto)}
                        style={{
                          marginTop: '16px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          backgroundColor: '#FEE2E2',
                          color: '#B91C1C',
                          border: '1px solid #FECACA',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    overflowX: 'auto',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Descripción</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Categoría</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Unidad</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Precio compra</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Precio venta</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Stock</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Impuesto</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Fecha registro</th>
                        <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p) => (
                        <tr key={p.id_producto} style={{ backgroundColor: '#FFFFFF' }}>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.descripcion}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.categoria}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.unidad_medida}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>L {p.precio_compra}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>L {p.precio_venta}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.stock_actual}</td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>
                            {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}
                          </td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>
                            {p.fecha_registro || 'Sin fecha'}
                          </td>
                          <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>
                            <button
                              onClick={() => eliminarProducto(p.id_producto)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                backgroundColor: '#FEE2E2',
                                color: '#B91C1C',
                                border: '1px solid #FECACA',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '12px',
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {pestanaActiva === 'operaciones' && (
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #D1D5DB',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>
              Operaciones de stock
            </h2>

            <form onSubmit={guardarOperacionStock}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={estiloLabel}>Descripción</label>
                  <input
                    type="text"
                    list="lista-descripciones-operacion"
                    value={descripcionOperacion}
                    onChange={(e) => setDescripcionOperacion(e.target.value)}
                    required
                    placeholder="Seleccione una descripción existente"
                    style={estiloInput}
                  />
                  <datalist id="lista-descripciones-operacion">
                    {descripcionesExistentes.map((item, index) => (
                      <option key={index} value={item} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={estiloLabel}>Tipo de operación</label>
                  <select
                    value={tipoOperacion}
                    onChange={(e) => setTipoOperacion(e.target.value)}
                    required
                    style={estiloInput}
                  >
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                  </select>
                </div>

                <div>
                  <label style={estiloLabel}>Cantidad</label>
                  <input
                    type="number"
                    value={cantidadOperacion}
                    onChange={(e) => setCantidadOperacion(e.target.value)}
                    required
                    min="1"
                    placeholder="Ingrese la cantidad"
                    style={estiloInput}
                  />
                </div>

                <div>
                  <label style={estiloLabel}>Fecha de operación</label>
                  <input
                    type="date"
                    value={fechaOperacion}
                    onChange={(e) => setFechaOperacion(e.target.value)}
                    required
                    style={estiloInput}
                  />
                </div>
              </div>

              <div style={{ marginTop: '22px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 22px',
                    cursor: 'pointer',
                    backgroundColor: '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 8px 18px rgba(15,118,110,0.18)',
                  }}
                >
                  Guardar operación
                </button>
              </div>
            </form>
          </div>
        )}

        {pestanaActiva === 'reportes' && (
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #D1D5DB',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>
              Reporte de productos
            </h2>

            <div
              style={{
                overflowX: 'auto',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Descripción</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Categoría</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Unidad</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Precio compra</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Precio venta</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Stock</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Impuesto</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Fecha registro</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: '18px',
                          textAlign: 'center',
                          color: '#6B7280',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        No hay productos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    productos.map((p) => (
                      <tr key={p.id_producto} style={{ backgroundColor: '#FFFFFF' }}>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.descripcion}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.categoria}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.unidad_medida}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>L {p.precio_compra}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>L {p.precio_venta}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>{p.stock_actual}</td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>
                          {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}
                        </td>
                        <td style={{ padding: '14px', borderBottom: '1px solid #F3F4F6' }}>
                          {p.fecha_registro || 'Sin fecha'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}