'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type VistaConfiguracion = 'menu' | 'autorizacionFiscal'

type TipoDocumentoFiscal = 'factura' | 'nota_credito'

type AutorizacionFiscal = {
  id_autorizacion: number
  codigo_autorizacion: string
  tipo_documento: TipoDocumentoFiscal | string
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

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function fechaMasUnAnio() {
  const fecha = new Date()
  fecha.setFullYear(fecha.getFullYear() + 1)
  return fecha.toISOString().split('T')[0]
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

function construirSecuencia(prefijo: string, numero: number, relleno: number) {
  return `${prefijo}${String(numero).padStart(relleno, '0')}`
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function nombreTipoDocumento(tipo: string) {
  if (tipo === 'nota_credito') return 'Nota de crédito'
  return 'Factura'
}

export default function ConfiguracionesTab() {
  const [vista, setVista] = useState<VistaConfiguracion>('menu')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [autorizaciones, setAutorizaciones] = useState<AutorizacionFiscal[]>([])
  const [idEditando, setIdEditando] = useState<number | null>(null)

  const [formulario, setFormulario] = useState({
    codigo_autorizacion: '',
    tipo_documento: 'factura' as TipoDocumentoFiscal,
    nombre_secuencia: '',
    prefijo: '',
    valor_inicial: '1',
    valor_maximo: '',
    relleno: '8',
    proximo_numero: '1',
    fecha_inicio: hoyLocal(),
    fecha_expiracion: fechaMasUnAnio(),
    activo: true,
  })

  useEffect(() => {
    cargarAutorizaciones()
  }, [])

  async function cargarAutorizaciones() {
    const { data, error } = await supabase
      .from('autorizaciones_fiscales')
      .select('*')
      .order('id_autorizacion', { ascending: false })

    if (error) {
      console.log('Error al cargar autorizaciones:', error)
      setMensaje(`Error al cargar autorizaciones: ${obtenerMensajeError(error)}`)
      return
    }

    setAutorizaciones(data || [])
  }

  function manejarCambio(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function manejarActivo(e: React.ChangeEvent<HTMLInputElement>) {
    setFormulario((prev) => ({
      ...prev,
      activo: e.target.checked,
    }))
  }

  function limpiarFormulario() {
    setIdEditando(null)
    setFormulario({
      codigo_autorizacion: '',
      tipo_documento: 'factura',
      nombre_secuencia: '',
      prefijo: '',
      valor_inicial: '1',
      valor_maximo: '',
      relleno: '8',
      proximo_numero: '1',
      fecha_inicio: hoyLocal(),
      fecha_expiracion: fechaMasUnAnio(),
      activo: true,
    })
  }

  function cargarParaEditar(autorizacion: AutorizacionFiscal) {
    setIdEditando(autorizacion.id_autorizacion)
    setFormulario({
      codigo_autorizacion: autorizacion.codigo_autorizacion || '',
      tipo_documento: autorizacion.tipo_documento as TipoDocumentoFiscal,
      nombre_secuencia: autorizacion.nombre_secuencia || '',
      prefijo: autorizacion.prefijo || '',
      valor_inicial: String(autorizacion.valor_inicial || 1),
      valor_maximo: String(autorizacion.valor_maximo || ''),
      relleno: String(autorizacion.relleno || 8),
      proximo_numero: String(autorizacion.proximo_numero || autorizacion.valor_inicial || 1),
      fecha_inicio: autorizacion.fecha_inicio || hoyLocal(),
      fecha_expiracion: autorizacion.fecha_expiracion || fechaMasUnAnio(),
      activo: Boolean(autorizacion.activo),
    })

    setMensaje(`Editando autorización fiscal: ${autorizacion.nombre_secuencia}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function cambiarEstadoAutorizacion(autorizacion: AutorizacionFiscal) {
    const nuevoEstado = !autorizacion.activo
    const textoAccion = nuevoEstado ? 'activar' : 'desactivar'

    const confirmar = window.confirm(
      `¿Está seguro que desea ${textoAccion} la autorización "${autorizacion.nombre_secuencia}"?`
    )

    if (!confirmar) return

    setGuardando(true)
    setMensaje('')

    try {
      const { error } = await supabase
        .from('autorizaciones_fiscales')
        .update({ activo: nuevoEstado })
        .eq('id_autorizacion', autorizacion.id_autorizacion)

      if (error) throw error

      if (idEditando === autorizacion.id_autorizacion) {
        setFormulario((prev) => ({ ...prev, activo: nuevoEstado }))
      }

      setMensaje(
        nuevoEstado
          ? 'Autorización fiscal activada correctamente.'
          : 'Autorización fiscal desactivada correctamente.'
      )

      await cargarAutorizaciones()
    } catch (error: any) {
      console.log('Error al cambiar estado:', error)
      setMensaje(`Error al cambiar estado: ${obtenerMensajeError(error)}`)
    } finally {
      setGuardando(false)
    }
  }

  async function guardarAutorizacionFiscal() {
    setMensaje('')

    const codigo = formulario.codigo_autorizacion.trim()
    const tipoDocumento = formulario.tipo_documento
    const nombreSecuencia = formulario.nombre_secuencia.trim()
    const prefijo = formulario.prefijo.trim()
    const valorInicial = Number(formulario.valor_inicial)
    const valorMaximo = Number(formulario.valor_maximo)
    const relleno = Number(formulario.relleno)
    const proximoNumero = Number(formulario.proximo_numero)

    if (!codigo) {
      setMensaje('Debe ingresar el código de autorización CAI.')
      return
    }

    if (!nombreSecuencia) {
      setMensaje('Debe ingresar el nombre de la secuencia.')
      return
    }

    if (!prefijo) {
      setMensaje('Debe ingresar el prefijo fiscal.')
      return
    }

    if (!valorInicial || valorInicial <= 0) {
      setMensaje('El valor inicial debe ser mayor que cero.')
      return
    }

    if (!valorMaximo || valorMaximo < valorInicial) {
      setMensaje('El valor máximo debe ser mayor o igual al valor inicial.')
      return
    }

    if (!relleno || relleno <= 0) {
      setMensaje('El relleno debe ser mayor que cero.')
      return
    }

    if (!proximoNumero || proximoNumero < valorInicial || proximoNumero > valorMaximo) {
      setMensaje('El próximo número a usar debe estar dentro del rango autorizado.')
      return
    }

    setGuardando(true)

    try {
      if (idEditando) {
        const { error: errorUpdate } = await supabase
          .from('autorizaciones_fiscales')
          .update({
            codigo_autorizacion: codigo,
            tipo_documento: tipoDocumento,
            nombre_secuencia: nombreSecuencia,
            prefijo,
            valor_inicial: valorInicial,
            valor_maximo: valorMaximo,
            relleno,
            proximo_numero: proximoNumero,
            fecha_inicio: formulario.fecha_inicio,
            fecha_expiracion: formulario.fecha_expiracion,
            activo: formulario.activo,
          })
          .eq('id_autorizacion', idEditando)

        if (errorUpdate) throw errorUpdate

        const { data: correlativosUsados, error: errorUsados } = await supabase
          .from('correlativos_fiscales')
          .select('numero')
          .eq('id_autorizacion', idEditando)
          .eq('usado', true)

        if (errorUsados) throw errorUsados

        const numerosUsados = new Set((correlativosUsados || []).map((item) => Number(item.numero)))

        const correlativosPendientes = []
        for (let numero = proximoNumero; numero <= valorMaximo; numero++) {
          if (numerosUsados.has(numero)) continue

          correlativosPendientes.push({
            id_autorizacion: idEditando,
            codigo_autorizacion: codigo,
            tipo_documento: tipoDocumento,
            secuencia_fiscal: construirSecuencia(prefijo, numero, relleno),
            numero,
            usado: false,
          })
        }

        if (correlativosPendientes.length > 0) {
          const { error: errorCorrelativos } = await supabase
            .from('correlativos_fiscales')
            .upsert(correlativosPendientes, {
              onConflict: 'tipo_documento,secuencia_fiscal',
              ignoreDuplicates: false,
            })

          if (errorCorrelativos) throw errorCorrelativos
        }

        setMensaje('Autorización fiscal actualizada correctamente.')
        limpiarFormulario()
        await cargarAutorizaciones()
        return
      }

      const { data: autorizacionCreada, error: errorAutorizacion } = await supabase
        .from('autorizaciones_fiscales')
        .insert([
          {
            codigo_autorizacion: codigo,
            tipo_documento: tipoDocumento,
            nombre_secuencia: nombreSecuencia,
            prefijo,
            valor_inicial: valorInicial,
            valor_maximo: valorMaximo,
            relleno,
            proximo_numero: proximoNumero,
            fecha_inicio: formulario.fecha_inicio,
            fecha_expiracion: formulario.fecha_expiracion,
            activo: formulario.activo,
          },
        ])
        .select('id_autorizacion')
        .single()

      if (errorAutorizacion) throw errorAutorizacion

      const idAutorizacion = autorizacionCreada.id_autorizacion

      const correlativos = []

      for (let numero = proximoNumero; numero <= valorMaximo; numero++) {
        correlativos.push({
          id_autorizacion: idAutorizacion,
          codigo_autorizacion: codigo,
          tipo_documento: tipoDocumento,
          secuencia_fiscal: construirSecuencia(prefijo, numero, relleno),
          numero,
          usado: false,
        })
      }

      if (correlativos.length > 0) {
        const { error: errorCorrelativos } = await supabase
          .from('correlativos_fiscales')
          .upsert(correlativos, {
            onConflict: 'tipo_documento,secuencia_fiscal',
            ignoreDuplicates: false,
          })

        if (errorCorrelativos) throw errorCorrelativos
      }

      setMensaje(
        `Autorización fiscal guardada correctamente. Se generaron las secuencias desde ${construirSecuencia(
          prefijo,
          proximoNumero,
          relleno
        )} hasta ${construirSecuencia(prefijo, valorMaximo, relleno)}.`
      )

      limpiarFormulario()
      await cargarAutorizaciones()
    } catch (error: any) {
      const mensajeError = obtenerMensajeError(error)
      console.log('Error al guardar autorización fiscal:', error)
      setMensaje(`Error al guardar autorización fiscal: ${mensajeError}`)
    } finally {
      setGuardando(false)
    }
  }

  if (vista === 'autorizacionFiscal') {
    return (
      <div className="text-black">
        <button
          type="button"
          onClick={() => setVista('menu')}
          className="mb-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Volver a Configuraciones
        </button>

        <h2 className="text-2xl font-bold mb-4 text-black">Autorización Fiscal</h2>

        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 className="text-xl font-bold text-black">
              {idEditando ? 'Modificar autorización fiscal' : 'Nueva autorización fiscal'}
            </h3>

            {idEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-black">Código de Autorización CAI</label>
              <input
                type="text"
                name="codigo_autorizacion"
                value={formulario.codigo_autorizacion}
                onChange={manejarCambio}
                placeholder="Ejemplo: 53074B-A562AF-354E95-6BAF46-90A598-62"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Tipo de documento</label>
              <select
                name="tipo_documento"
                value={formulario.tipo_documento}
                onChange={manejarCambio}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              >
                <option value="factura">Factura</option>
                <option value="nota_credito">Nota de crédito</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Nombre de la secuencia</label>
              <input
                type="text"
                name="nombre_secuencia"
                value={formulario.nombre_secuencia}
                onChange={manejarCambio}
                placeholder="Ejemplo: Facturas 01-500"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Prefijo</label>
              <input
                type="text"
                name="prefijo"
                value={formulario.prefijo}
                onChange={manejarCambio}
                placeholder="Ejemplo: 000-001-01-"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Valor inicial</label>
              <input
                type="number"
                name="valor_inicial"
                value={formulario.valor_inicial}
                onChange={manejarCambio}
                placeholder="1"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Valor máximo</label>
              <input
                type="number"
                name="valor_maximo"
                value={formulario.valor_maximo}
                onChange={manejarCambio}
                placeholder="500"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Relleno</label>
              <input
                type="number"
                name="relleno"
                value={formulario.relleno}
                onChange={manejarCambio}
                placeholder="8"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Próximo número a usar</label>
              <input
                type="number"
                name="proximo_numero"
                value={formulario.proximo_numero}
                onChange={manejarCambio}
                placeholder="8"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Fecha de inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                value={formulario.fecha_inicio}
                onChange={manejarCambio}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-black">Fecha de expiración</label>
              <input
                type="date"
                name="fecha_expiracion"
                value={formulario.fecha_expiracion}
                onChange={manejarCambio}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-black">
                <input
                  type="checkbox"
                  checked={formulario.activo}
                  onChange={manejarActivo}
                />
                Activo
              </label>
            </div>
          </div>

          {mensaje && (
            <div className="mt-6 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black shadow-sm">
              {mensaje}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {idEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={guardarAutorizacionFiscal}
              disabled={guardando}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
            >
              {guardando
                ? idEditando
                  ? 'Actualizando...'
                  : 'Guardando...'
                : idEditando
                  ? 'Actualizar autorización fiscal'
                  : 'Guardar autorización fiscal'}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-black">Autorizaciones fiscales registradas</h3>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-black">
                  <th className="border border-gray-200 p-3">Nombre</th>
                  <th className="border border-gray-200 p-3">Documento</th>
                  <th className="border border-gray-200 p-3">Prefijo</th>
                  <th className="border border-gray-200 p-3">Rango</th>
                  <th className="border border-gray-200 p-3">Próximo</th>
                  <th className="border border-gray-200 p-3">Vigencia</th>
                  <th className="border border-gray-200 p-3">Estado</th>
                  <th className="border border-gray-200 p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {autorizaciones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-200 p-4 text-center text-gray-500">
                      No hay autorizaciones fiscales registradas.
                    </td>
                  </tr>
                ) : (
                  autorizaciones.map((autorizacion) => (
                    <tr key={autorizacion.id_autorizacion} className="text-black">
                      <td className="border border-gray-200 p-3">{autorizacion.nombre_secuencia}</td>
                      <td className="border border-gray-200 p-3">
                        {nombreTipoDocumento(autorizacion.tipo_documento)}
                      </td>
                      <td className="border border-gray-200 p-3">{autorizacion.prefijo}</td>
                      <td className="border border-gray-200 p-3">
                        {autorizacion.valor_inicial} - {autorizacion.valor_maximo}
                      </td>
                      <td className="border border-gray-200 p-3">{autorizacion.proximo_numero}</td>
                      <td className="border border-gray-200 p-3">
                        {formatearFecha(autorizacion.fecha_inicio)} / {formatearFecha(autorizacion.fecha_expiracion)}
                      </td>
                      <td className="border border-gray-200 p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            autorizacion.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {autorizacion.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const accion = e.currentTarget.value
                            e.currentTarget.value = ''

                            if (accion === 'modificar') {
                              cargarParaEditar(autorizacion)
                            }

                            if (accion === 'estado') {
                              cambiarEstadoAutorizacion(autorizacion)
                            }
                          }}
                          className="rounded-lg bg-white border border-gray-300 px-2 py-1 text-black"
                        >
                          <option value="" disabled hidden>
                            Acción
                          </option>
                          <option value="modificar">Modificar</option>
                          <option value="estado">
                            {autorizacion.activo ? 'Desactivar' : 'Activar'}
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-600">
            Recomendación: no elimine autorizaciones fiscales con historial. Si una autorización venció
            o dejó de utilizarse, desactívela para conservar la trazabilidad de facturas y documentos emitidos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Configuraciones</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setVista('autorizacionFiscal')}
          className="rounded-2xl border border-gray-300 bg-gray-50 p-6 text-left shadow-sm hover:bg-gray-100"
        >
          <div className="text-lg font-bold text-black">Autorización Fiscal</div>
          <p className="mt-2 text-sm text-gray-600">
            Crear y administrar secuencias fiscales para facturas y notas de crédito.
          </p>
        </button>
      </div>
    </div>
  )
}
