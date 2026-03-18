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
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
        Cargando productos...
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Productos</h2>

      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="w-full md:w-80">
          <label className="block mb-1 font-medium text-white">Filtrar por categoría</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-slate-300">
          Mostrando {productosFiltrados.length} producto(s)
        </div>
      </div>

      {mensaje && (
        <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white">
          {mensaje}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full border-collapse">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left border border-slate-700">Código</th>
              <th className="p-3 text-left border border-slate-700">Descripción</th>
              <th className="p-3 text-left border border-slate-700">Categoría</th>
              <th className="p-3 text-left border border-slate-700">Unidad</th>
              <th className="p-3 text-right border border-slate-700">Precio Compra</th>
              <th className="p-3 text-right border border-slate-700">Precio Venta</th>
              <th className="p-3 text-center border border-slate-700">Impuesto</th>
              <th className="p-3 text-center border border-slate-700">Stock</th>
              <th className="p-3 text-center border border-slate-700">Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-4 text-center border border-slate-700 bg-slate-900 text-slate-300"
                >
                  No hay productos para mostrar con ese filtro.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => (
                <tr key={producto.id_producto} className="bg-slate-900 text-white">
                  <td className="p-3 border border-slate-700">{producto.id_producto}</td>
                  <td className="p-3 border border-slate-700">{producto.descripcion}</td>
                  <td className="p-3 border border-slate-700">
                    {producto.categoria || '-'}
                  </td>
                  <td className="p-3 border border-slate-700">
                    {producto.unidad_medida || '-'}
                  </td>
                  <td className="p-3 border border-slate-700 text-right">
                    {moneda(producto.precio_compra)}
                  </td>
                  <td className="p-3 border border-slate-700 text-right">
                    {moneda(producto.precio_venta)}
                  </td>
                  <td className="p-3 border border-slate-700 text-center">
                    {Number(producto.impuesto || 0) === 15 ? 'ISV 15%' : 'Exento'}
                  </td>
                  <td className="p-3 border border-slate-700 text-center">
                    {producto.stock_actual ?? 0}
                  </td>
                  <td className="p-3 border border-slate-700 text-center">
                    {formatearFecha(producto.fecha_registro)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}