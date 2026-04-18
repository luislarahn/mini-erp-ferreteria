'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Producto = {
  id_producto: number
  descripcion: string
  categoria: string | null
  unidad_medida: string | null
  precio_compra: number | null
  precio_venta: number | null
  stock_actual: number | null
  impuesto: number | null
  fecha_registro: string | null
}

function moneda(valor: number | null) {
  return `L ${(Number(valor) || 0).toFixed(2)}`
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export default function ReporteProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    setCargando(true)
    setMensaje('')

    try {
      const { data, error } = await supabase
        .from('productos')
        .select(
          'id_producto, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, impuesto, fecha_registro'
        )
        .order('id_producto', { ascending: false })

      if (error) throw error

      setProductos(data || [])
    } catch (error: any) {
      console.log('Error al cargar productos:', error)
      setMensaje(`Error al cargar productos: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  const categorias = useMemo(() => {
    const lista = productos
      .map((p) => (p.categoria || '').trim())
      .filter((categoria) => categoria !== '')

    return ['Todas', ...Array.from(new Set(lista)).sort((a, b) => a.localeCompare(b))]
  }, [productos])

  const productosFiltrados = useMemo(() => {
    if (filtroCategoria === 'Todas') return productos

    return productos.filter(
      (producto) => (producto.categoria || '').trim() === filtroCategoria
    )
  }, [productos, filtroCategoria])

  if (cargando) {
    return (
      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-6 text-gray-800 shadow-sm">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Productos</h2>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:w-80">
            <label className="block mb-1 font-medium text-black">Filtrar por categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
            >
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {productosFiltrados.length} producto(s)
          </div>
        </div>

        {mensaje && (
          <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
            {mensaje}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="p-3 text-left border border-gray-200">ID</th>
                <th className="p-3 text-left border border-gray-200">Descripción</th>
                <th className="p-3 text-left border border-gray-200">Categoría</th>
                <th className="p-3 text-left border border-gray-200">Unidad</th>
                <th className="p-3 text-right border border-gray-200">Precio compra</th>
                <th className="p-3 text-right border border-gray-200">Precio venta</th>
                <th className="p-3 text-center border border-gray-200">Stock</th>
                <th className="p-3 text-center border border-gray-200">Impuesto</th>
                <th className="p-3 text-center border border-gray-200">Fecha registro</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-4 text-center border border-gray-200 bg-white text-gray-500"
                  >
                    No hay productos para mostrar.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => (
                  <tr key={producto.id_producto} className="bg-white text-black">
                    <td className="p-3 border border-gray-200">{producto.id_producto}</td>
                    <td className="p-3 border border-gray-200">{producto.descripcion}</td>
                    <td className="p-3 border border-gray-200">{producto.categoria || '-'}</td>
                    <td className="p-3 border border-gray-200">{producto.unidad_medida || '-'}</td>
                    <td className="p-3 border border-gray-200 text-right">
                      {moneda(producto.precio_compra)}
                    </td>
                    <td className="p-3 border border-gray-200 text-right">
                      {moneda(producto.precio_venta)}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      {producto.stock_actual ?? 0}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      {Number(producto.impuesto || 0) === 15 ? 'ISV 15%' : 'Exento'}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      {formatearFecha(producto.fecha_registro)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}