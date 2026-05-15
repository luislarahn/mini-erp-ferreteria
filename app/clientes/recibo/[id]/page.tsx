'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Recibo = {
  id_recibo: number
  id_cliente: number | null
  secuencia_recibo: string
  anio: number
  correlativo: number
  nombre_cliente: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  fecha_recibo: string
  descripcion: string
  valor_recibido: number
  estado: string
  descripcion_aplicacion: string | null
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

export default function ReciboImprimiblePage() {
  const params = useParams()
  const router = useRouter()

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const idRecibo = Number(idParam)

  const [recibo, setRecibo] = useState<Recibo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!idRecibo || Number.isNaN(idRecibo)) {
      setMensaje('El ID del recibo no es válido.')
      setCargando(false)
      return
    }

    cargarRecibo()
  }, [idRecibo])

  async function cargarRecibo() {
    setCargando(true)
    setMensaje('')

    try {
      const { data, error } = await supabase
        .from('recibos_pago')
        .select('*')
        .eq('id_recibo', idRecibo)
        .single()

      if (error) throw error

      setRecibo(data)
    } catch (error: any) {
      console.log('Error al cargar recibo:', error)
      setMensaje(error?.message || 'No se pudo cargar el recibo.')
    } finally {
      setCargando(false)
    }
  }

  function imprimirRecibo() {
    if (recibo?.secuencia_recibo) {
      document.title = `Recibo ${recibo.secuencia_recibo}`
    }

    window.print()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            Cargando recibo...
          </div>
        </div>
      </div>
    )
  }

  if (mensaje) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
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

  if (!recibo) {
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

          .recibo-print {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 8mm 9mm !important;
          }

          @page {
            size: letter;
            margin: 6mm;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="no-print flex gap-3 justify-end mb-4">
          <button
            onClick={() => router.push('/clientes')}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            Volver
          </button>

          <button
            onClick={imprimirRecibo}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        <div className="recibo-print bg-white text-black rounded-2xl shadow-xl border border-slate-300 p-7 text-[11px] leading-tight">
          {/* ENCABEZADO COMPACTO */}
          <div className="mb-4 grid grid-cols-12 items-start gap-3">
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
              <h2 className="text-[18px] font-bold leading-none tracking-wide">RECIBO DE PAGO</h2>
              <p className="mt-2">
                <span className="font-bold">No. Recibo:</span> {recibo.secuencia_recibo}
              </p>
              <p>
                <span className="font-bold">Fecha:</span>{' '}
                {formatearFecha(recibo.fecha_recibo)}
              </p>
              <p>
                <span className="font-bold">Estado:</span> {recibo.estado || 'Emitido'}
              </p>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div className="mb-4 rounded border border-slate-300 px-3 py-2">
            <div className="grid grid-cols-12 gap-x-3 gap-y-1">
              <p className="col-span-8">
                <span className="font-bold">Cliente:</span> {recibo.nombre_cliente}
              </p>
              <p className="col-span-4">
                <span className="font-bold">Teléfono:</span> {recibo.telefono || '-'}
              </p>
              <p className="col-span-8">
                <span className="font-bold">Dirección:</span> {recibo.direccion || '-'}
              </p>
              <p className="col-span-4">
                <span className="font-bold">Correo:</span> {recibo.correo || '-'}
              </p>
            </div>
          </div>

          {/* DESCRIPCIÓN Y VALOR */}
          <div className="mb-4 grid grid-cols-12 gap-4">
            <div className="col-span-8 rounded border border-slate-300 px-3 py-3 min-h-[120px]">
              <p className="mb-2 font-bold">Descripción / Concepto:</p>
              <p className="whitespace-pre-wrap leading-5">{recibo.descripcion}</p>
            </div>

            <div className="col-span-4">
              <div className="rounded border border-slate-300 px-3 py-3">
                <div className="flex justify-between border-b border-slate-300 pb-2 text-[12px] font-bold">
                  <span>Valor recibido:</span>
                  <span>{moneda(recibo.valor_recibido)}</span>
                </div>

                <div className="mt-3">
                  <p className="font-bold">Total en Letras:</p>
                  <p className="mt-1 leading-5">{totalEnLetras(recibo.valor_recibido)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DECLARACIÓN */}
          <div className="mb-10 rounded border border-slate-300 px-3 py-3">
            <p>
              Por medio del presente recibo se hace constar que Ferretería PROIS ha recibido de{' '}
              <span className="font-bold">{recibo.nombre_cliente}</span> la cantidad de{' '}
              <span className="font-bold">{moneda(recibo.valor_recibido)}</span>, por el concepto
              descrito en este documento.
              {recibo.descripcion_aplicacion && (
                <>
                  {' '}
                  <span>{recibo.descripcion_aplicacion}</span>
                </>
              )}
            </p>
          </div>

          {/* FIRMAS */}
          <div className="mt-12 grid grid-cols-2 gap-10 text-center text-[11px]">
            <div>
              <div className="mx-auto mb-2 h-px w-64 bg-black"></div>
              <p>Recibí conforme</p>
            </div>

            <div>
              <div className="mx-auto mb-2 h-px w-64 bg-black"></div>
              <p>Autorizado por</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-600">
            Documento interno emitido por Ferretería PROIS.
          </div>
        </div>
      </div>
    </div>
  )
}
