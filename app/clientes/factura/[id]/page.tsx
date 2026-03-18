'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Factura = {
  id_factura: number
  secuencia_fiscal: string
  nombre_cliente: string
  direccion: string | null
  correo: string | null
  telefono: string | null
  rtn: string | null
  fecha_factura: string
  subtotal: number
  impuesto_total: number
  total_factura: number
  estado: string
}

type DetalleFactura = {
  id_detalle: number
  id_factura: number
  descripcion_producto: string
  cantidad: number
  precio_unitario: number
  porcentaje_impuesto: number
  subtotal_linea: number
  monto_impuesto_linea: number
  total_linea: number
}

const DATOS_EMPRESA = {
  nombre: 'MiniERP Ferretería',
  rtn: '0801-0000-000000',
  direccion: 'Tegucigalpa, Honduras',
  telefono: '0000-0000',
  correo: 'ventas@mini-erp.com',
}

function moneda(valor: number | string | null | undefined) {
  return `L ${Number(valor || 0).toFixed(2)}`
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export default function FacturaImprimiblePage() {
  const params = useParams()
  const router = useRouter()

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const idFactura = Number(idParam)

  const [factura, setFactura] = useState<Factura | null>(null)
  const [detalle, setDetalle] = useState<DetalleFactura[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!idFactura || Number.isNaN(idFactura)) {
      setMensaje('El ID de la factura no es válido.')
      setCargando(false)
      return
    }

    cargarFactura()
  }, [idFactura])

  async function cargarFactura() {
    setCargando(true)
    setMensaje('')

    try {
      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas')
        .select('*')
        .eq('id_factura', idFactura)
        .single()

      if (facturaError) throw facturaError

      const { data: detalleData, error: detalleError } = await supabase
        .from('factura_detalle')
        .select('*')
        .eq('id_factura', idFactura)
        .order('id_detalle', { ascending: true })

      if (detalleError) throw detalleError

      setFactura(facturaData)
      setDetalle(detalleData || [])
    } catch (error: any) {
      console.log('Error al cargar factura:', error)
      setMensaje(error?.message || 'No se pudo cargar la factura.')
    } finally {
      setCargando(false)
    }
  }

  function imprimirFactura() {
    window.print()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            Cargando factura...
          </div>
        </div>
      </div>
    )
  }

  if (mensaje) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-red-700 bg-slate-900 p-6">
            {mensaje}
          </div>

          <div className="mt-4 no-print">
            <button
              onClick={() => router.push('/clientes')}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Volver a Clientes
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!factura) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="no-print flex gap-3 justify-end mb-4">
          <button
            onClick={() => router.push('/clientes')}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            Volver
          </button>

          <button
            onClick={imprimirFactura}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        <div className="factura-print bg-white text-black rounded-2xl shadow-xl border border-slate-300 p-8">
          <div className="flex justify-between items-start gap-6 border-b border-slate-300 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{DATOS_EMPRESA.nombre}</h1>
              <p className="mt-2 text-sm">RTN: {DATOS_EMPRESA.rtn}</p>
              <p className="text-sm">{DATOS_EMPRESA.direccion}</p>
              <p className="text-sm">Tel: {DATOS_EMPRESA.telefono}</p>
              <p className="text-sm">{DATOS_EMPRESA.correo}</p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold">FACTURA</h2>
              <p className="mt-2 text-sm">
                <span className="font-semibold">No.:</span> {factura.secuencia_fiscal}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Fecha:</span> {formatearFecha(factura.fecha_factura)}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Estado:</span> {factura.estado}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-slate-300 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-3">Facturar a:</h3>
              <p><span className="font-semibold">Cliente:</span> {factura.nombre_cliente}</p>
              <p><span className="font-semibold">RTN:</span> {factura.rtn || '-'}</p>
              <p><span className="font-semibold">Dirección:</span> {factura.direccion || '-'}</p>
            </div>

            <div className="border border-slate-300 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-3">Contacto:</h3>
              <p><span className="font-semibold">Correo:</span> {factura.correo || '-'}</p>
              <p><span className="font-semibold">Teléfono:</span> {factura.telefono || '-'}</p>
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-left">Producto</th>
                  <th className="border border-slate-300 p-3 text-center">Cantidad</th>
                  <th className="border border-slate-300 p-3 text-right">Precio Unitario</th>
                  <th className="border border-slate-300 p-3 text-center">Impuesto</th>
                  <th className="border border-slate-300 p-3 text-right">Total Línea</th>
                </tr>
              </thead>
              <tbody>
                {detalle.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 p-4 text-center">
                      No hay detalle para esta factura.
                    </td>
                  </tr>
                ) : (
                  detalle.map((item) => (
                    <tr key={item.id_detalle}>
                      <td className="border border-slate-300 p-3">{item.descripcion_producto}</td>
                      <td className="border border-slate-300 p-3 text-center">{item.cantidad}</td>
                      <td className="border border-slate-300 p-3 text-right">
                        {moneda(item.precio_unitario)}
                      </td>
                      <td className="border border-slate-300 p-3 text-center">
                        {Number(item.porcentaje_impuesto) === 15 ? 'ISV 15%' : 'Exento'}
                      </td>
                      <td className="border border-slate-300 p-3 text-right">
                        {moneda(item.total_linea)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-md border border-slate-300 rounded-xl p-4">
              <div className="flex justify-between py-2">
                <span className="font-medium">Subtotal:</span>
                <span>{moneda(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200">
                <span className="font-medium">Impuesto:</span>
                <span>{moneda(factura.impuesto_total)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 text-xl font-bold">
                <span>Total Factura:</span>
                <span>{moneda(factura.total_factura)}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-300 text-sm text-slate-700">
            <p>Gracias por su compra.</p>
            <p>Documento generado desde MiniERP.</p>
          </div>
        </div>
      </div>
    </div>
  )
}