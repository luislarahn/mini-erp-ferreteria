'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Factura = {
  id_factura: number
  id_correlativo: number | null
  secuencia_fiscal: string
  nombre_cliente: string
  direccion: string | null
  correo: string | null
  telefono: string | null
  rtn: string | null
  fecha_factura: string
  subtotal: number
  importe_exonerado: number | null
  importe_exento: number | null
  importe_gravado_15: number | null
  importe_gravado_18: number | null
  isv_15: number | null
  isv_18: number | null
  impuesto_total: number
  total_factura: number
  estado: string
  descripcion_anulacion: string | null
}

type DetalleFactura = {
  id_detalle: number
  id_factura: number
  descripcion_producto: string
  cantidad: number
  precio_unitario: number
  tipo_impuesto: string | null
  porcentaje_impuesto: number
  subtotal_linea: number
  monto_impuesto_linea: number
  total_linea: number
}

type CorrelativoFiscal = {
  id_correlativo: number
  id_autorizacion: number | null
  codigo_autorizacion: string | null
  tipo_documento: string | null
  secuencia_fiscal: string
  numero: number
}

type AutorizacionFiscal = {
  id_autorizacion: number
  codigo_autorizacion: string
  tipo_documento: string
  nombre_secuencia: string
  prefijo: string
  valor_inicial: number
  valor_maximo: number
  relleno: number
  proximo_numero: number
  fecha_inicio: string
  fecha_expiracion: string
  activo: boolean
}

type NotaCreditoAplicada = {
  id_nota_credito: number
  secuencia_fiscal: string
  descripcion_aplicacion: string | null
  estado: string
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

function formatearSecuencia(prefijo: string, numero: number, relleno: number) {
  return `${prefijo}${String(numero).padStart(relleno, '0')}`
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

export default function FacturaImprimiblePage() {
  const params = useParams()
  const router = useRouter()

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const idFactura = Number(idParam)

  const [factura, setFactura] = useState<Factura | null>(null)
  const [detalle, setDetalle] = useState<DetalleFactura[]>([])
  const [correlativo, setCorrelativo] = useState<CorrelativoFiscal | null>(null)
  const [autorizacion, setAutorizacion] = useState<AutorizacionFiscal | null>(null)
  const [notasAplicadas, setNotasAplicadas] = useState<NotaCreditoAplicada[]>([])
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

      const { data: notasData, error: notasError } = await supabase
        .from('notas_credito')
        .select('id_nota_credito, secuencia_fiscal, descripcion_aplicacion, estado')
        .eq('id_factura_aplicada', idFactura)
        .eq('estado', 'Aplicada')
        .order('id_nota_credito', { ascending: true })

      if (notasError) throw notasError

      setFactura(facturaData)
      setDetalle(detalleData || [])
      setNotasAplicadas(notasData || [])

      if (facturaData?.id_correlativo) {
        const { data: correlativoData, error: correlativoError } = await supabase
          .from('correlativos_fiscales')
          .select('*')
          .eq('id_correlativo', facturaData.id_correlativo)
          .single()

        if (!correlativoError && correlativoData) {
          setCorrelativo(correlativoData)

          if (correlativoData.id_autorizacion) {
            const { data: autorizacionData, error: autorizacionError } = await supabase
              .from('autorizaciones_fiscales')
              .select('*')
              .eq('id_autorizacion', correlativoData.id_autorizacion)
              .single()

            if (!autorizacionError && autorizacionData) {
              setAutorizacion(autorizacionData)
            }
          }
        }
      }
    } catch (error: any) {
      console.log('Error al cargar factura:', error)
      setMensaje(error?.message || 'No se pudo cargar la factura.')
    } finally {
      setCargando(false)
    }
  }

  function imprimirFactura() {
    if (factura?.secuencia_fiscal) {
      document.title = `Factura ${factura.secuencia_fiscal}`
    }

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

  const facturaAnulada = factura.estado === 'Anulada'
  const cai = autorizacion?.codigo_autorizacion || correlativo?.codigo_autorizacion || ''
  const rangoInicial = autorizacion
    ? formatearSecuencia(autorizacion.prefijo, autorizacion.valor_inicial, autorizacion.relleno)
    : ''
  const rangoFinal = autorizacion
    ? formatearSecuencia(autorizacion.prefijo, autorizacion.valor_maximo, autorizacion.relleno)
    : ''

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

          .factura-print {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 7mm 8mm !important;
          }

          .marca-anulada {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
            onClick={imprimirFactura}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        <div className="factura-print relative overflow-hidden bg-white text-black rounded-2xl shadow-xl border border-slate-300 p-7 text-[11px] leading-tight">
          {facturaAnulada && (
            <div
              className="marca-anulada pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="-rotate-45 text-[95px] font-black tracking-[0.25em] text-red-600 opacity-10">
                ANULADA
              </div>
            </div>
          )}

          <div className="relative z-10">
            {/* ENCABEZADO COMPACTO */}
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
                <h2 className="text-[18px] font-bold leading-none tracking-wide">FACTURA</h2>
                <p className="mt-2">
                  <span className="font-bold">No.:</span> {factura.secuencia_fiscal}
                </p>
                <p>
                  <span className="font-bold">Fecha:</span>{' '}
                  {formatearFecha(factura.fecha_factura)}
                </p>
                <p>
                  <span className="font-bold">Estado:</span> {factura.estado || 'Emitida'}
                </p>
              </div>
            </div>

            {/* DATOS DEL CLIENTE */}
            <div className="mb-3 rounded border border-slate-300 px-3 py-2">
              <div className="grid grid-cols-12 gap-x-3 gap-y-1">
                <p className="col-span-8">
                  <span className="font-bold">Cliente:</span> {factura.nombre_cliente}
                </p>
                <p className="col-span-4">
                  <span className="font-bold">RTN:</span> {factura.rtn || '-'}
                </p>
                <p className="col-span-8">
                  <span className="font-bold">Dirección:</span> {factura.direccion || '-'}
                </p>
                <p className="col-span-4">
                  <span className="font-bold">Cod:</span>
                </p>
              </div>
            </div>

            {/* DETALLE */}
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
                        No hay detalle para esta factura.
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

            {/* TOTALES Y LETRAS EN LA MISMA FRANJA */}
            <div className="mb-3 grid grid-cols-12 gap-4">
              <div className="col-span-7">
                <div className="mb-3">
                  <p className="font-bold">Total en Letras:</p>
                  <p className="mt-1">{totalEnLetras(factura.total_factura)}</p>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  <p>
                    <span className="font-bold">Reg O/C Exenta:</span>
                  </p>
                  <p>
                    <span className="font-bold">Reg Exonerados:</span>
                  </p>
                  <p>
                    <span className="font-bold">No. Registro SAG:</span>
                  </p>

                  {facturaAnulada && factura.descripcion_anulacion && (
                    <p className="mt-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-800">
                      <span className="font-bold">Motivo de anulación:</span>{' '}
                      {factura.descripcion_anulacion}
                    </p>
                  )}

                  {!facturaAnulada &&
                    notasAplicadas.map((nota) => (
                      <p
                        key={nota.id_nota_credito}
                        className="mt-1 rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] text-cyan-900"
                      >
                        <span className="font-bold">Nota de crédito aplicada:</span>{' '}
                        {nota.descripcion_aplicacion ||
                          `Nota de crédito ${nota.secuencia_fiscal} aplicada a esta factura.`}
                      </p>
                    ))}
                </div>
              </div>

              <div className="col-span-5">
                <div className="w-full text-[10.5px]">
                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>Sub Total:</span>
                    <span>{moneda(factura.subtotal)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>Importe Exonerado:</span>
                    <span>{moneda(factura.importe_exonerado)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>Importe Exento:</span>
                    <span>{moneda(factura.importe_exento)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>Importe Gravado 15%:</span>
                    <span>{moneda(factura.importe_gravado_15)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>Importe Gravado 18%:</span>
                    <span>{moneda(factura.importe_gravado_18)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>I.S.V. 15%:</span>
                    <span>{moneda(factura.isv_15)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-300 py-[2px]">
                    <span>I.S.V. 18%:</span>
                    <span>{moneda(factura.isv_18)}</span>
                  </div>

                  <div className="mt-1 flex justify-between border-t border-black pt-1 text-[12px] font-bold">
                    <span>TOTAL A PAGAR:</span>
                    <span>{moneda(factura.total_factura)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INFORMACIÓN FISCAL Y COPIAS EN DOS COLUMNAS */}
            <div className="mt-3 grid grid-cols-12 gap-4 border-t border-slate-300 pt-2">
              <div className="col-span-7">
                <p>
                  <span className="font-bold">C.A.I.:</span> {cai || '-'}
                </p>
                <p>
                  <span className="font-bold">Fecha Límite de Emisión:</span>{' '}
                  {formatearFecha(autorizacion?.fecha_expiracion)}
                </p>
                <p>
                  <span className="font-bold">Rango Autorizado:</span>{' '}
                  {rangoInicial || '-'} - al - {rangoFinal || '-'}
                </p>
              </div>

              <div className="col-span-5">
                <p>Original: Cliente</p>
                <p>Copia: Obligado Tributario</p>
                <p>Triplicado: Archivo</p>
                <p>Modalidad de Impresión: SFC en Red Fijo</p>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] font-semibold">
              La Factura es beneficio de todos, ¡Exíjala!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
