'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Cotizacion = {
  id_cotizacion: number
  numero_cotizacion: string
  nombre_cliente: string
  direccion: string | null
  correo: string | null
  telefono: string | null
  rtn: string | null
  fecha_cotizacion: string
  subtotal: number
  importe_exonerado: number | null
  importe_exento: number | null
  importe_gravado_15: number | null
  importe_gravado_18: number | null
  isv_15: number | null
  isv_18: number | null
  impuesto_total: number
  total_cotizacion: number
  estado: string
}

type DetalleCotizacion = {
  id_detalle: number
  id_cotizacion: number
  descripcion_producto: string
  cantidad: number
  precio_unitario: number
  tipo_impuesto: string | null
  porcentaje_impuesto: number
  subtotal_linea: number
  monto_impuesto_linea: number
  total_linea: number
}

const DATOS_EMPRESA = {
  nombre: 'Ferretería PROIS',
  eslogan: '“Todo para construir con confianza.”',
  rtn: '08011920048018',
  direccion: 'Colonia Miraflores, Calle principal',
  telefono: '2239-8747',
  correo: 'contacto@prois.com',
}

function numero(valor: number | string | null | undefined) {
  return Number(valor || 0)
}

function moneda(valor: number | string | null | undefined) {
  return `L ${numero(valor).toFixed(2)}`
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function numeroALetrasEntero(numero: number): string {
  const unidades = [
    '',
    'Uno',
    'Dos',
    'Tres',
    'Cuatro',
    'Cinco',
    'Seis',
    'Siete',
    'Ocho',
    'Nueve',
    'Diez',
    'Once',
    'Doce',
    'Trece',
    'Catorce',
    'Quince',
    'Dieciséis',
    'Diecisiete',
    'Dieciocho',
    'Diecinueve',
  ]

  const decenas = [
    '',
    '',
    'Veinte',
    'Treinta',
    'Cuarenta',
    'Cincuenta',
    'Sesenta',
    'Setenta',
    'Ochenta',
    'Noventa',
  ]

  const centenas = [
    '',
    'Ciento',
    'Doscientos',
    'Trescientos',
    'Cuatrocientos',
    'Quinientos',
    'Seiscientos',
    'Setecientos',
    'Ochocientos',
    'Novecientos',
  ]

  if (numero === 0) return 'Cero'
  if (numero === 100) return 'Cien'
  if (numero < 20) return unidades[numero]
  if (numero < 30) {
    if (numero === 20) return 'Veinte'
    return `Veinti${unidades[numero - 20].toLowerCase()}`
  }
  if (numero < 100) {
    const unidad = numero % 10
    const decena = Math.floor(numero / 10)
    return unidad === 0 ? decenas[decena] : `${decenas[decena]} y ${unidades[unidad]}`
  }
  if (numero < 1000) {
    const centena = Math.floor(numero / 100)
    const resto = numero % 100
    return resto === 0 ? centenas[centena] : `${centenas[centena]} ${numeroALetrasEntero(resto)}`
  }
  if (numero < 1000000) {
    const miles = Math.floor(numero / 1000)
    const resto = numero % 1000
    const textoMiles = miles === 1 ? 'Mil' : `${numeroALetrasEntero(miles)} Mil`
    return resto === 0 ? textoMiles : `${textoMiles} ${numeroALetrasEntero(resto)}`
  }

  const millones = Math.floor(numero / 1000000)
  const resto = numero % 1000000
  const textoMillones = millones === 1 ? 'Un Millón' : `${numeroALetrasEntero(millones)} Millones`
  return resto === 0 ? textoMillones : `${textoMillones} ${numeroALetrasEntero(resto)}`
}

function totalEnLetras(valor: number | string | null | undefined) {
  const total = numero(valor)
  const entero = Math.floor(total)
  const centavos = Math.round((total - entero) * 100)

  return `${numeroALetrasEntero(entero)} HNL Con ${String(centavos).padStart(2, '0')} /100`
}

export default function CotizacionImprimiblePage() {
  const params = useParams()
  const router = useRouter()

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const idCotizacion = Number(idParam)

  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [detalle, setDetalle] = useState<DetalleCotizacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!idCotizacion || Number.isNaN(idCotizacion)) {
      setMensaje('El ID de la cotización no es válido.')
      setCargando(false)
      return
    }

    cargarCotizacion()
  }, [idCotizacion])

  async function cargarCotizacion() {
    setCargando(true)
    setMensaje('')

    try {
      const { data: cotizacionData, error: cotizacionError } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id_cotizacion', idCotizacion)
        .single()

      if (cotizacionError) throw cotizacionError

      const { data: detalleData, error: detalleError } = await supabase
        .from('detalle_cotizacion')
        .select('*')
        .eq('id_cotizacion', idCotizacion)
        .order('id_detalle', { ascending: true })

      if (detalleError) throw detalleError

      setCotizacion(cotizacionData)
      setDetalle(detalleData || [])
    } catch (error: any) {
      console.log('Error al cargar cotización:', error)
      setMensaje(error?.message || 'No se pudo cargar la cotización.')
    } finally {
      setCargando(false)
    }
  }

  function imprimirCotizacion() {
    if (cotizacion?.numero_cotizacion) {
      document.title = `Cotización ${cotizacion.numero_cotizacion}`
    }

    window.print()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            Cargando cotización...
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

  if (!cotizacion) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <style jsx global>{`
        @media print {
          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .cotizacion-print {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 7mm 8mm !important;
          }

          @page {
            size: letter;
            margin: 5mm;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="no-print flex gap-3 justify-end mb-4">
          <button
            onClick={() => router.push('/clientes')}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            Volver
          </button>

          <button
            onClick={imprimirCotizacion}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        <div className="cotizacion-print bg-white text-black rounded-2xl shadow-xl border border-slate-300 p-7 text-[11px] leading-tight">
          <div className="mb-3 grid grid-cols-12 items-start gap-3">
            <div className="col-span-7">
              <h1 className="text-[20px] font-bold leading-none">{DATOS_EMPRESA.nombre}</h1>
              <p className="mt-1 text-[11px]">{DATOS_EMPRESA.eslogan}</p>
              <p>RTN {DATOS_EMPRESA.rtn}</p>
              <p>
                {DATOS_EMPRESA.direccion}, Tel {DATOS_EMPRESA.telefono}
              </p>
              <p>Correo: {DATOS_EMPRESA.correo}</p>
            </div>

            <div className="col-span-5 text-right">
              <h2 className="text-[18px] font-bold leading-none tracking-wide">COTIZACIÓN</h2>
              <p className="mt-2">
                <span className="font-bold">No.:</span> {cotizacion.numero_cotizacion}
              </p>
              <p>
                <span className="font-bold">Fecha:</span>{' '}
                {formatearFecha(cotizacion.fecha_cotizacion)}
              </p>
              <p>
                <span className="font-bold">Estado:</span> {cotizacion.estado || 'Activa'}
              </p>
            </div>
          </div>

          <div className="mb-3 rounded border border-slate-300 px-3 py-2">
            <div className="grid grid-cols-12 gap-x-3 gap-y-1">
              <p className="col-span-8">
                <span className="font-bold">Cliente:</span> {cotizacion.nombre_cliente}
              </p>
              <p className="col-span-4">
                <span className="font-bold">RTN:</span> {cotizacion.rtn || '-'}
              </p>
              <p className="col-span-8">
                <span className="font-bold">Dirección:</span> {cotizacion.direccion || '-'}
              </p>
              <p className="col-span-4">
                <span className="font-bold">Teléfono:</span> {cotizacion.telefono || '-'}
              </p>
              <p className="col-span-12">
                <span className="font-bold">Correo:</span> {cotizacion.correo || '-'}
              </p>
            </div>
          </div>

          <div className="mb-3 min-h-[120px] overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-black">
                  <th className="py-1.5 text-left">Descripción</th>
                  <th className="w-[55px] py-1.5 text-center">Cant.</th>
                  <th className="w-[75px] py-1.5 text-right">Precio</th>
                  <th className="w-[72px] py-1.5 text-center">Tipo Imp.</th>
                  <th className="w-[75px] py-1.5 text-right">Impuesto</th>
                  <th className="w-[80px] py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {detalle.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center">
                      No hay detalle para esta cotización.
                    </td>
                  </tr>
                ) : (
                  detalle.map((item) => (
                    <tr key={item.id_detalle} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2">{item.descripcion_producto}</td>
                      <td className="py-1.5 text-center">{item.cantidad}</td>
                      <td className="py-1.5 text-right">{moneda(item.precio_unitario)}</td>
                      <td className="py-1.5 text-center">{item.tipo_impuesto || '-'}</td>
                      <td className="py-1.5 text-right">{moneda(item.monto_impuesto_linea)}</td>
                      <td className="py-1.5 text-right">{moneda(item.total_linea)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mb-3 grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <p className="font-bold">Total en Letras:</p>
              <p className="mt-1">{totalEnLetras(cotizacion.total_cotizacion)}</p>

              <div className="mt-4 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-[10.5px]">
                <p className="font-bold">Nota:</p>
                <p>
                  Este documento es una cotización de carácter informativo. Los precios y la disponibilidad de productos pueden variar al momento de facturar.
                </p>
              </div>
            </div>

            <div className="col-span-5">
              <div className="w-full text-[10.5px]">
                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>Sub Total:</span>
                  <span>{moneda(cotizacion.subtotal)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>Importe Exonerado:</span>
                  <span>{moneda(cotizacion.importe_exonerado)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>Importe Exento:</span>
                  <span>{moneda(cotizacion.importe_exento)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>Importe Gravado 15%:</span>
                  <span>{moneda(cotizacion.importe_gravado_15)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>Importe Gravado 18%:</span>
                  <span>{moneda(cotizacion.importe_gravado_18)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>I.S.V. 15%:</span>
                  <span>{moneda(cotizacion.isv_15)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-300 py-[2px]">
                  <span>I.S.V. 18%:</span>
                  <span>{moneda(cotizacion.isv_18)}</span>
                </div>

                <div className="mt-1 flex justify-between border-t border-black pt-1 text-[12px] font-bold">
                  <span>TOTAL COTIZACIÓN:</span>
                  <span>{moneda(cotizacion.total_cotizacion)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-10 text-center text-[11px]">
            <div>
              <div className="border-t border-black pt-2">Firma autorizada</div>
            </div>
            <div>
              <div className="border-t border-black pt-2">Recibido por cliente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

