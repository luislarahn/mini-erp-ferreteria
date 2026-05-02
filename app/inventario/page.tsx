'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type PestanaActiva = 'registros' | 'operaciones' | 'reportes'
type VistaProductos = 'kanban' | 'lista'
type TipoReporteInventario = 'productos' | 'movimientos'

export default function InventarioPage() {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('registros')
  const [vistaProductos, setVistaProductos] = useState<VistaProductos>('kanban')

  const [productos, setProductos] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [descripcionesExistentes, setDescripcionesExistentes] = useState<string[]>([])
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([])
  const [unidadesExistentes, setUnidadesExistentes] = useState<string[]>([])

  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('10')
  const [tipoImpuesto, setTipoImpuesto] = useState('ISV')
  const [fechaRegistro, setFechaRegistro] = useState('')

  const [idProductoEditando, setIdProductoEditando] = useState<number | null>(null)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [menuAccionAbierto, setMenuAccionAbierto] = useState<number | null>(null)

  const [descripcionOperacion, setDescripcionOperacion] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState('Entrada')
  const [cantidadOperacion, setCantidadOperacion] = useState('')
  const [fechaOperacion, setFechaOperacion] = useState('')

  const [tipoReporte, setTipoReporte] = useState<TipoReporteInventario>('productos')
  const [filtroCategoriaProducto, setFiltroCategoriaProducto] = useState('Todas')
  const [filtroUnidadProducto, setFiltroUnidadProducto] = useState('Todas')
  const [filtroRangoStock, setFiltroRangoStock] = useState('Todos')
  const [mostrarSoloAlertas, setMostrarSoloAlertas] = useState(false)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroCategoriaMovimiento, setFiltroCategoriaMovimiento] = useState('Todas')
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState('Todos')

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
    obtenerMovimientos()
  }, [])

  useEffect(() => {
    if (!descripcion.trim() || idProductoEditando !== null) return

    const productoCoincidente = productos.find(
      (p) =>
        p.descripcion?.trim().toLowerCase() ===
        descripcion.trim().toLowerCase()
    )

    if (productoCoincidente) {
      setCategoria(productoCoincidente.categoria || '')
      setUnidadMedida(productoCoincidente.unidad_medida || '')
      setStockMinimo(String(productoCoincidente.stock_minimo ?? 10))
      setTipoImpuesto(Number(productoCoincidente.impuesto) === 0 ? 'Exento' : 'ISV')
      setFechaRegistro(
        productoCoincidente.fecha_registro || new Date().toISOString().split('T')[0]
      )
    }
  }, [descripcion, productos, idProductoEditando])

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

      const unidadesUnicas = [
        ...new Set(lista.map((p) => p.unidad_medida).filter(Boolean)),
      ]

      setDescripcionesExistentes(descripcionesUnicas)
      setCategoriasExistentes(categoriasUnicas)
      setUnidadesExistentes(unidadesUnicas)
    }
  }

  async function obtenerMovimientos() {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .order('id_movimiento', { ascending: false })

    if (error) {
      console.log('Error al obtener movimientos:', error)
    } else {
      setMovimientos(data || [])
    }
  }

  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault()

    const descripcionLimpia = descripcion.trim()
    const categoriaLimpia = categoria.trim()
    const unidadMedidaLimpia = unidadMedida.trim()
    const impuestoValor = tipoImpuesto === 'Exento' ? 0 : 15
    const stockMinimoValor = Number(stockMinimo || 10)

    if (idProductoEditando !== null) {
      const { error } = await supabase
        .from('productos')
        .update({
          descripcion: descripcionLimpia,
          categoria: categoriaLimpia,
          unidad_medida: unidadMedidaLimpia,
          precio_compra: Number(precioCompra),
          precio_venta: Number(precioVenta),
          stock_actual: Number(stockActual),
          stock_minimo: stockMinimoValor,
          impuesto: impuestoValor,
          fecha_registro: fechaRegistro,
        })
        .eq('id_producto', idProductoEditando)

      if (error) {
        console.log('Error al actualizar producto:', error)
        alert('Ocurrió un error al actualizar el producto')
      } else {
        alert('Producto actualizado correctamente')
        limpiarFormulario()
        obtenerProductos()
      }

      return
    }

    const productoExistente = productos.find(
      (p) =>
        p.descripcion?.trim().toLowerCase() ===
        descripcionLimpia.toLowerCase()
    )

    if (productoExistente) {
      const confirmar = confirm(
        'Ya existe un producto con esta descripción. ¿Desea actualizar ese registro?'
      )

      if (!confirmar) return

      const { error } = await supabase
        .from('productos')
        .update({
          categoria: categoriaLimpia,
          unidad_medida: unidadMedidaLimpia,
          precio_compra: Number(precioCompra),
          precio_venta: Number(precioVenta),
          stock_actual: Number(stockActual),
          stock_minimo: stockMinimoValor,
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
          stock_minimo: stockMinimoValor,
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
          categoria: productoExistente.categoria,
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
    obtenerMovimientos()
  }

  function limpiarFormulario() {
    const hoy = new Date().toISOString().split('T')[0]
    setDescripcion('')
    setCategoria('')
    setUnidadMedida('')
    setPrecioCompra('')
    setPrecioVenta('')
    setStockActual('')
    setStockMinimo('10')
    setTipoImpuesto('ISV')
    setFechaRegistro(hoy)
    setIdProductoEditando(null)
  }

  function limpiarFormularioOperacion() {
    const hoy = new Date().toISOString().split('T')[0]
    setDescripcionOperacion('')
    setTipoOperacion('Entrada')
    setCantidadOperacion('')
    setFechaOperacion(hoy)
  }

  function editarProducto(producto: any) {
    setIdProductoEditando(producto.id_producto)
    setDescripcion(producto.descripcion || '')
    setCategoria(producto.categoria || '')
    setUnidadMedida(producto.unidad_medida || '')
    setPrecioCompra(String(producto.precio_compra ?? ''))
    setPrecioVenta(String(producto.precio_venta ?? ''))
    setStockActual(String(producto.stock_actual ?? ''))
    setStockMinimo(String(producto.stock_minimo ?? 10))
    setTipoImpuesto(Number(producto.impuesto) === 0 ? 'Exento' : 'ISV')
    setFechaRegistro(producto.fecha_registro || new Date().toISOString().split('T')[0])
    setMenuAccionAbierto(null)

    window.scrollTo({
      top: 120,
      behavior: 'smooth',
    })
  }

  async function eliminarProducto(id: number) {
    const confirmar = confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')

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
      setMenuAccionAbierto(null)
      obtenerProductos()
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('miniERPAuth')
    router.push('/')
  }

  function productoTieneStockBajo(producto: any) {
    return Number(producto.stock_actual || 0) <= Number(producto.stock_minimo ?? 10)
  }

  function obtenerProductoPorMovimiento(movimiento: any) {
    return productos.find(
      (p) =>
        Number(p.id_producto) === Number(movimiento.id_producto) ||
        p.descripcion?.trim().toLowerCase() === movimiento.descripcion?.trim().toLowerCase()
    )
  }

  function obtenerCategoriaMovimiento(movimiento: any) {
    if (movimiento.categoria && movimiento.categoria.trim() !== '') {
      return movimiento.categoria
    }

    const productoRelacionado = obtenerProductoPorMovimiento(movimiento)
    return productoRelacionado?.categoria || '-'
  }

  function obtenerTipoMovimientoBase(movimiento: any) {
    const tipo = movimiento.tipo_operacion || ''

    if (tipo.toLowerCase().includes('factura')) {
      return 'Venta'
    }

    if (tipo.toLowerCase().includes('salida')) {
      return 'Salida'
    }

    if (tipo.toLowerCase().includes('entrada')) {
      return 'Entrada'
    }

    return tipo
  }

  const productosFiltradosListado = useMemo(() => {
    const texto = busquedaProducto.trim().toLowerCase()

    if (!texto) return productos

    return productos.filter((p) => {
      return (
        p.descripcion?.toLowerCase().includes(texto) ||
        p.categoria?.toLowerCase().includes(texto) ||
        p.unidad_medida?.toLowerCase().includes(texto)
      )
    })
  }, [productos, busquedaProducto])

  const productosFiltradosReporte = useMemo(() => {
    return productos.filter((p) => {
      const cumpleCategoria =
        filtroCategoriaProducto === 'Todas' || p.categoria === filtroCategoriaProducto

      const cumpleUnidad =
        filtroUnidadProducto === 'Todas' || p.unidad_medida === filtroUnidadProducto

      const stock = Number(p.stock_actual || 0)
      let cumpleStock = true

      if (filtroRangoStock === '0') cumpleStock = stock === 0
      if (filtroRangoStock === '1-100') cumpleStock = stock >= 1 && stock <= 100
      if (filtroRangoStock === '101-200') cumpleStock = stock >= 101 && stock <= 200
      if (filtroRangoStock === '201-300') cumpleStock = stock >= 201 && stock <= 300
      if (filtroRangoStock === '301-400') cumpleStock = stock >= 301 && stock <= 400
      if (filtroRangoStock === '401-500') cumpleStock = stock >= 401 && stock <= 500
      if (filtroRangoStock === 'mayor-500') cumpleStock = stock > 500

      const cumpleAlerta = !mostrarSoloAlertas || productoTieneStockBajo(p)

      return cumpleCategoria && cumpleUnidad && cumpleStock && cumpleAlerta
    })
  }, [
    productos,
    filtroCategoriaProducto,
    filtroUnidadProducto,
    filtroRangoStock,
    mostrarSoloAlertas,
  ])

  const movimientosFiltradosReporte = useMemo(() => {
    return movimientos.filter((m) => {
      const categoriaMovimiento = obtenerCategoriaMovimiento(m)
      const tipoMovimientoBase = obtenerTipoMovimientoBase(m)

      const cumpleCategoria =
        filtroCategoriaMovimiento === 'Todas' || categoriaMovimiento === filtroCategoriaMovimiento

      const cumpleTipo =
        filtroTipoMovimiento === 'Todos' ||
        tipoMovimientoBase === filtroTipoMovimiento

      const fecha = m.fecha_registro || ''
      const cumpleFechaDesde = !filtroFechaDesde || fecha >= filtroFechaDesde
      const cumpleFechaHasta = !filtroFechaHasta || fecha <= filtroFechaHasta

      return cumpleCategoria && cumpleTipo && cumpleFechaDesde && cumpleFechaHasta
    })
  }, [
    movimientos,
    productos,
    filtroCategoriaMovimiento,
    filtroTipoMovimiento,
    filtroFechaDesde,
    filtroFechaHasta,
  ])

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

  const estiloCaja = {
    backgroundColor: '#F9FAFB',
    border: '1px solid #D1D5DB',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
  }

  const estiloTablaContenedor = {
    overflowX: 'auto' as const,
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
  }

  const estiloTh = {
    padding: '14px',
    textAlign: 'left' as const,
    color: '#374151',
    borderBottom: '1px solid #E5E7EB',
  }

  const estiloTd = {
    padding: '14px',
    borderBottom: '1px solid #F3F4F6',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Arial, sans-serif', color: '#1F2937' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>
              Ferretería PROIS
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
              “Todo para construir con confianza.”
            </p>
          </div>

          <div ref={menuRef} style={{ position: 'relative' }}>
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
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                A
              </span>
              Admin
              <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
            </button>

            {menuAbierto && (
              <div style={{ position: 'absolute', top: '58px', right: 0, width: '220px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 18px 35px rgba(0,0,0,0.10)', overflow: 'hidden', zIndex: 1000 }}>
                <Link href="/documentacion" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Documentación
                </Link>
                <Link href="/soporte" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Soporte
                </Link>
                <Link href="/preferencias" style={{ display: 'block', padding: '13px 16px', textDecoration: 'none', color: '#374151' }}>
                  Preferencias
                </Link>
                <button onClick={cerrarSesion} style={{ width: '100%', textAlign: 'left', padding: '13px 16px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 'bold' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#374151', textDecoration: 'none', fontWeight: 'bold', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          ← Volver al dashboard
        </a>

        <div style={{ marginBottom: '22px' }}>
          <button type="button" onClick={() => setPestanaActiva('registros')} style={estiloPestana(pestanaActiva === 'registros')}>Registros</button>
          <button type="button" onClick={() => setPestanaActiva('operaciones')} style={estiloPestana(pestanaActiva === 'operaciones')}>Operaciones</button>
          <button type="button" onClick={() => setPestanaActiva('reportes')} style={estiloPestana(pestanaActiva === 'reportes')}>Reportes</button>
        </div>

        {pestanaActiva === 'registros' && (
          <>
            <div style={{ ...estiloCaja, marginBottom: '24px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>
                {idProductoEditando ? 'Editar producto' : 'Registro de productos'}
              </h2>

              {idProductoEditando && (
                <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 'bold' }}>
                  Está editando un producto existente. Revise los campos y presione “Actualizar producto”.
                </div>
              )}

              <form onSubmit={guardarProducto}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={estiloLabel}>Descripción</label>
                    <input type="text" list="lista-descripciones" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required placeholder="Escriba o seleccione una descripción" style={estiloInput} />
                    <datalist id="lista-descripciones">
                      {descripcionesExistentes.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={estiloLabel}>Categoría</label>
                    <input type="text" list="lista-categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} required placeholder="Categoría" style={estiloInput} />
                    <datalist id="lista-categorias">
                      {categoriasExistentes.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={estiloLabel}>Unidad de medida</label>
                    <input type="text" value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} required placeholder="Unidad" style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Precio compra</label>
                    <input type="number" step="0.01" value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} required style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Precio venta</label>
                    <input type="number" step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} required style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Stock actual</label>
                    <input type="number" value={stockActual} onChange={(e) => setStockActual(e.target.value)} required style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Stock mínimo</label>
                    <input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} required min="0" style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Impuesto</label>
                    <select value={tipoImpuesto} onChange={(e) => setTipoImpuesto(e.target.value)} required style={estiloInput}>
                      <option value="ISV">ISV (15%)</option>
                      <option value="Exento">Exento (0%)</option>
                    </select>
                  </div>

                  <div>
                    <label style={estiloLabel}>Fecha de registro</label>
                    <input type="date" value={fechaRegistro} onChange={(e) => setFechaRegistro(e.target.value)} required style={estiloInput} />
                  </div>
                </div>

                <div style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button type="submit" style={{ padding: '12px 22px', cursor: 'pointer', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
                    {idProductoEditando ? 'Actualizar producto' : 'Guardar producto'}
                  </button>

                  {idProductoEditando && (
                    <button type="button" onClick={limpiarFormulario} style={{ padding: '12px 22px', cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '12px', fontWeight: 'bold' }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div style={estiloCaja}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, color: '#111827' }}>Listado de productos</h2>
                <div>
                  <button type="button" onClick={() => setVistaProductos('kanban')} style={estiloVista(vistaProductos === 'kanban')}>Kanban</button>
                  <button type="button" onClick={() => setVistaProductos('lista')} style={estiloVista(vistaProductos === 'lista')}>Lista</button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>Buscar producto</label>
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  placeholder="Buscar por descripción, categoría o unidad"
                  style={estiloInput}
                />
              </div>

              <p style={{ color: '#6B7280', marginTop: 0 }}>
                Mostrando {productosFiltradosListado.length} producto(s).
              </p>

              {productosFiltradosListado.length === 0 ? (
                <p style={{ color: '#6B7280' }}>No hay productos para mostrar.</p>
              ) : vistaProductos === 'kanban' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {productosFiltradosListado.map((p) => {
                    const esStockBajo = productoTieneStockBajo(p)
                    const stockMinimoValor = Number(p.stock_minimo ?? 10)

                    return (
                      <div key={p.id_producto} style={{ backgroundColor: esStockBajo ? '#FEF2F2' : '#FFFFFF', border: esStockBajo ? '1px solid #FCA5A5' : '1px solid #E5E7EB', padding: '20px', borderRadius: '20px' }}>
                        <strong>{p.descripcion}</strong>

                        {esStockBajo && (
                          <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 'bold', fontSize: '13px' }}>
                            ⚠ Stock bajo | Mínimo: {stockMinimoValor}
                          </div>
                        )}

                        <div style={{ color: '#4B5563', lineHeight: 1.8, fontSize: '14px', marginTop: '12px' }}>
                          <div><strong>Categoría:</strong> {p.categoria}</div>
                          <div><strong>Unidad:</strong> {p.unidad_medida}</div>
                          <div><strong>Precio compra:</strong> L {p.precio_compra}</div>
                          <div><strong>Precio venta:</strong> L {p.precio_venta}</div>
                          <div><strong>Stock actual:</strong> {p.stock_actual}</div>
                          <div><strong>Stock mínimo:</strong> {stockMinimoValor}</div>
                          <div><strong>Impuesto:</strong> {Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}</div>
                          <div><strong>Fecha registro:</strong> {p.fecha_registro || 'Sin fecha'}</div>
                        </div>

                        <div style={{ marginTop: '16px', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setMenuAccionAbierto(menuAccionAbierto === p.id_producto ? null : p.id_producto)}
                            style={{ padding: '10px 16px', cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '12px', fontWeight: 'bold' }}
                          >
                            Acciones ▾
                          </button>

                          {menuAccionAbierto === p.id_producto && (
                            <div style={{ position: 'absolute', top: '44px', left: 0, width: '150px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 24px rgba(0,0,0,0.10)', zIndex: 20, overflow: 'hidden' }}>
                              <button type="button" onClick={() => editarProducto(p)} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#374151', fontWeight: 'bold' }}>
                                Editar
                              </button>
                              <button type="button" onClick={() => eliminarProducto(p.id_producto)} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 'bold' }}>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={estiloTablaContenedor}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th style={estiloTh}>Descripción</th>
                        <th style={estiloTh}>Categoría</th>
                        <th style={estiloTh}>Unidad</th>
                        <th style={estiloTh}>Precio compra</th>
                        <th style={estiloTh}>Precio venta</th>
                        <th style={estiloTh}>Stock</th>
                        <th style={estiloTh}>Stock mínimo</th>
                        <th style={estiloTh}>Impuesto</th>
                        <th style={estiloTh}>Fecha registro</th>
                        <th style={estiloTh}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltradosListado.map((p) => {
                        const esStockBajo = productoTieneStockBajo(p)

                        return (
                          <tr key={p.id_producto} style={{ backgroundColor: esStockBajo ? '#FEF2F2' : '#FFFFFF' }}>
                            <td style={estiloTd}>{p.descripcion}</td>
                            <td style={estiloTd}>{p.categoria}</td>
                            <td style={estiloTd}>{p.unidad_medida}</td>
                            <td style={estiloTd}>L {p.precio_compra}</td>
                            <td style={estiloTd}>L {p.precio_venta}</td>
                            <td style={estiloTd}>
                              {p.stock_actual}
                              {esStockBajo && (
                                <span style={{ color: '#B91C1C', fontWeight: 'bold', marginLeft: '8px' }}>
                                  ⚠ Bajo
                                </span>
                              )}
                            </td>
                            <td style={estiloTd}>{Number(p.stock_minimo ?? 10)}</td>
                            <td style={estiloTd}>{Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}</td>
                            <td style={estiloTd}>{p.fecha_registro || 'Sin fecha'}</td>
                            <td style={{ ...estiloTd, position: 'relative' }}>
                              <button
                                type="button"
                                onClick={() => setMenuAccionAbierto(menuAccionAbierto === p.id_producto ? null : p.id_producto)}
                                style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '10px', fontWeight: 'bold' }}
                              >
                                Acciones ▾
                              </button>

                              {menuAccionAbierto === p.id_producto && (
                                <div style={{ position: 'absolute', top: '48px', right: '14px', width: '150px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 24px rgba(0,0,0,0.10)', zIndex: 20, overflow: 'hidden' }}>
                                  <button type="button" onClick={() => editarProducto(p)} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#374151', fontWeight: 'bold' }}>
                                    Editar
                                  </button>
                                  <button type="button" onClick={() => eliminarProducto(p.id_producto)} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 'bold' }}>
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {pestanaActiva === 'operaciones' && (
          <div style={estiloCaja}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>Operaciones de stock</h2>

            <form onSubmit={guardarOperacionStock}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div>
                  <label style={estiloLabel}>Descripción</label>
                  <input type="text" list="lista-descripciones-operacion" value={descripcionOperacion} onChange={(e) => setDescripcionOperacion(e.target.value)} required placeholder="Seleccione una descripción existente" style={estiloInput} />
                  <datalist id="lista-descripciones-operacion">
                    {descripcionesExistentes.map((item, index) => (
                      <option key={index} value={item} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={estiloLabel}>Tipo de operación</label>
                  <select value={tipoOperacion} onChange={(e) => setTipoOperacion(e.target.value)} required style={estiloInput}>
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                  </select>
                </div>

                <div>
                  <label style={estiloLabel}>Cantidad</label>
                  <input type="number" value={cantidadOperacion} onChange={(e) => setCantidadOperacion(e.target.value)} required min="1" placeholder="Ingrese la cantidad" style={estiloInput} />
                </div>

                <div>
                  <label style={estiloLabel}>Fecha de operación</label>
                  <input type="date" value={fechaOperacion} onChange={(e) => setFechaOperacion(e.target.value)} required style={estiloInput} />
                </div>
              </div>

              <div style={{ marginTop: '22px' }}>
                <button type="submit" style={{ padding: '12px 22px', cursor: 'pointer', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
                  Guardar operación
                </button>
              </div>
            </form>
          </div>
        )}

        {pestanaActiva === 'reportes' && (
          <div style={estiloCaja}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>Reportes de inventario</h2>

            <div style={{ marginBottom: '24px', maxWidth: '360px' }}>
              <label style={estiloLabel}>Seleccione el reporte</label>
              <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value as TipoReporteInventario)} style={estiloInput}>
                <option value="productos">Reporte General de Productos</option>
                <option value="movimientos">Reporte Entradas / Salidas</option>
              </select>
            </div>

            {tipoReporte === 'productos' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '22px', alignItems: 'end' }}>
                  <div>
                    <label style={estiloLabel}>Categoría</label>
                    <select value={filtroCategoriaProducto} onChange={(e) => setFiltroCategoriaProducto(e.target.value)} style={estiloInput}>
                      <option value="Todas">Todas</option>
                      {categoriasExistentes.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={estiloLabel}>Unidad</label>
                    <select value={filtroUnidadProducto} onChange={(e) => setFiltroUnidadProducto(e.target.value)} style={estiloInput}>
                      <option value="Todas">Todas</option>
                      {unidadesExistentes.map((unidad, index) => (
                        <option key={index} value={unidad}>{unidad}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={estiloLabel}>Rango de stock</label>
                    <select value={filtroRangoStock} onChange={(e) => setFiltroRangoStock(e.target.value)} style={estiloInput}>
                      <option value="Todos">Todos</option>
                      <option value="0">0</option>
                      <option value="1-100">1 - 100</option>
                      <option value="101-200">101 - 200</option>
                      <option value="201-300">201 - 300</option>
                      <option value="301-400">301 - 400</option>
                      <option value="401-500">401 - 500</option>
                      <option value="mayor-500">Mayor a 500</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setMostrarSoloAlertas(!mostrarSoloAlertas)}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        backgroundColor: mostrarSoloAlertas ? '#991B1B' : '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 8px 18px rgba(220,38,38,0.18)',
                      }}
                    >
                      Alertas
                    </button>
                  </div>
                </div>

                <p style={{ color: '#6B7280', marginBottom: '14px' }}>
                  Mostrando {productosFiltradosReporte.length} producto(s)
                  {mostrarSoloAlertas ? ' con alerta de stock bajo.' : '.'}
                </p>

                <div style={estiloTablaContenedor}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th style={estiloTh}>Descripción</th>
                        <th style={estiloTh}>Categoría</th>
                        <th style={estiloTh}>Unidad</th>
                        <th style={estiloTh}>Precio compra</th>
                        <th style={estiloTh}>Precio venta</th>
                        <th style={estiloTh}>Stock</th>
                        <th style={estiloTh}>Stock mínimo</th>
                        <th style={estiloTh}>Impuesto</th>
                        <th style={estiloTh}>Fecha registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltradosReporte.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '18px', textAlign: 'center', color: '#6B7280' }}>
                            No hay productos para mostrar.
                          </td>
                        </tr>
                      ) : (
                        productosFiltradosReporte.map((p) => {
                          const esStockBajo = productoTieneStockBajo(p)

                          return (
                            <tr key={p.id_producto} style={{ backgroundColor: esStockBajo ? '#FEF2F2' : '#FFFFFF' }}>
                              <td style={estiloTd}>{p.descripcion}</td>
                              <td style={estiloTd}>{p.categoria}</td>
                              <td style={estiloTd}>{p.unidad_medida}</td>
                              <td style={estiloTd}>L {p.precio_compra}</td>
                              <td style={estiloTd}>L {p.precio_venta}</td>
                              <td style={estiloTd}>
                                {p.stock_actual}
                                {esStockBajo && (
                                  <span style={{ color: '#B91C1C', fontWeight: 'bold', marginLeft: '8px' }}>
                                    ⚠ Bajo
                                  </span>
                                )}
                              </td>
                              <td style={estiloTd}>{Number(p.stock_minimo ?? 10)}</td>
                              <td style={estiloTd}>{Number(p.impuesto) === 0 ? 'Exento (0%)' : 'ISV (15%)'}</td>
                              <td style={estiloTd}>{p.fecha_registro || 'Sin fecha'}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tipoReporte === 'movimientos' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '22px' }}>
                  <div>
                    <label style={estiloLabel}>Fecha desde</label>
                    <input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Fecha hasta</label>
                    <input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} style={estiloInput} />
                  </div>

                  <div>
                    <label style={estiloLabel}>Categoría</label>
                    <select value={filtroCategoriaMovimiento} onChange={(e) => setFiltroCategoriaMovimiento(e.target.value)} style={estiloInput}>
                      <option value="Todas">Todas</option>
                      {categoriasExistentes.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={estiloLabel}>Tipo</label>
                    <select value={filtroTipoMovimiento} onChange={(e) => setFiltroTipoMovimiento(e.target.value)} style={estiloInput}>
                      <option value="Todos">Todos</option>
                      <option value="Entrada">Entrada</option>
                      <option value="Salida">Salida</option>
                      <option value="Venta">Ventas</option>
                    </select>
                  </div>
                </div>

                <p style={{ color: '#6B7280', marginBottom: '14px' }}>
                  Mostrando {movimientosFiltradosReporte.length} movimiento(s).
                </p>

                <div style={estiloTablaContenedor}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th style={estiloTh}>Fecha</th>
                        <th style={estiloTh}>Producto</th>
                        <th style={estiloTh}>Categoría</th>
                        <th style={estiloTh}>Tipo</th>
                        <th style={estiloTh}>Cantidad</th>
                        <th style={estiloTh}>Stock anterior</th>
                        <th style={estiloTh}>Stock nuevo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientosFiltradosReporte.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '18px', textAlign: 'center', color: '#6B7280' }}>
                            No hay movimientos para mostrar.
                          </td>
                        </tr>
                      ) : (
                        movimientosFiltradosReporte.map((m) => (
                          <tr key={m.id_movimiento}>
                            <td style={estiloTd}>{m.fecha_registro || 'Sin fecha'}</td>
                            <td style={estiloTd}>{m.descripcion}</td>
                            <td style={estiloTd}>{obtenerCategoriaMovimiento(m)}</td>
                            <td style={estiloTd}>{m.tipo_operacion}</td>
                            <td style={estiloTd}>{m.cantidad}</td>
                            <td style={estiloTd}>{m.stock_anterior}</td>
                            <td style={estiloTd}>{m.stock_nuevo}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
