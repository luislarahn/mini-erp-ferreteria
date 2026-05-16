'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type EmpleadoVacaciones = {
  id_empleado: number
  nombre_completo: string
  fecha_ingreso: string
  estado_laboral: 'Activo' | 'Despedido' | 'Retirado'
  id_puesto: number
  puesto: string
  departamento: string
}

type VacacionRegistro = {
  id: number
  empleadoId: number
  empleadoNombre: string
  diasCorrespondientes: number
  diasTomados: number
  diasPendientes: number
  periodoAdquirido: string
  fechaInicio: string
  fechaFin: string
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function calcularAntiguedad(fechaIngreso: string) {
  const ingreso = new Date(fechaIngreso)
  const hoy = new Date()

  let anios = hoy.getFullYear() - ingreso.getFullYear()
  let meses = hoy.getMonth() - ingreso.getMonth()
  let dias = hoy.getDate() - ingreso.getDate()

  if (dias < 0) {
    meses -= 1
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    dias += mesAnterior.getDate()
  }
  
  if (meses < 0) {
    anios -= 1
    meses += 12
  }

  if (anios < 0) {
    anios = 0
    meses = 0
    dias = 0
  }

  return { anios, meses, dias }
}

function calcularDiasVacaciones(anios: number) {
  if (anios < 1) return 0
  if (anios === 1) return 10
  if (anios === 2) return 12
  if (anios === 3) return 15
  if (anios === 4) return 18
  return 20
}

export default function VacacionesTab() {
  const [empleados, setEmpleados] = useState<EmpleadoVacaciones[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | ''>('')
  const [periodoAdquirido, setPeriodoAdquirido] = useState('')
  const [diasTomados, setDiasTomados] = useState(0)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [registros, setRegistros] = useState<VacacionRegistro[]>([])
  const [registroParaImprimir, setRegistroParaImprimir] = useState<VacacionRegistro | null>(null)
  const [ejecutarImpresion, setEjecutarImpresion] = useState(false)

  const empleadoSeleccionado = useMemo(
    () => empleados.find((empleado) => empleado.id_empleado === selectedEmpleadoId),
    [empleados, selectedEmpleadoId]
  )

  const diasCorrespondientes = useMemo(() => {
    if (!empleadoSeleccionado) return 0
    return calcularDiasVacaciones(calcularAntiguedad(empleadoSeleccionado.fecha_ingreso).anios)
  }, [empleadoSeleccionado])

  const diasPendientes = Math.max(0, diasCorrespondientes - diasTomados)

  useEffect(() => {
    cargarEmpleados()
    cargarRegistros()
  }, [])

  async function cargarRegistros() {
    const { data, error } = await supabase
      .from('vacaciones_registros')
      .select(
        `
          id,
          empleado_id,
          empleado_nombre,
          dias_correspondientes,
          dias_tomados,
          dias_pendientes,
          periodo_adquirido,
          fecha_inicio,
          fecha_fin
        `
      )
      .order('id', { ascending: false })

    if (error) {
      console.error('Error al cargar registros de vacaciones:', error)
      setMensaje(`Error al cargar registros: ${error.message}`)
      return
    } 

    const registrosFormateados: VacacionRegistro[] = (data || []).map((item: any) => ({
      id: item.id,
      empleadoId: item.empleado_id,
      empleadoNombre: item.empleado_nombre,
      diasCorrespondientes: item.dias_correspondientes,
      diasTomados: item.dias_tomados,
      diasPendientes: item.dias_pendientes,
      periodoAdquirido: item.periodo_adquirido,
      fechaInicio: item.fecha_inicio,
      fechaFin: item.fecha_fin,
    }))

    setRegistros(registrosFormateados)
  }

  async function cargarEmpleados() {
    setCargando(true)
    setMensaje('')

    const { data, error } = await supabase
      .from('empleados')
      .select(`
        id_empleado,
        nombre_completo,
        fecha_ingreso,
        estado_laboral,
        id_puesto,
        puestos(nombre_puesto, departamento)
      `)
      .order('id_empleado', { ascending: true })

    if (error) {
      console.error('Error al cargar empleados:', error)
      setMensaje(`Error al cargar empleados: ${error.message}`)
      setCargando(false)
      return
    }

    const lista: EmpleadoVacaciones[] = (data || []).map((item: any) => {
      const puestoRelacionado = Array.isArray(item.puestos)
        ? item.puestos[0]
        : item.puestos || {}

      return {
        id_empleado: item.id_empleado,
        nombre_completo: item.nombre_completo,
        fecha_ingreso: item.fecha_ingreso,
        estado_laboral: item.estado_laboral,
        id_puesto: item.id_puesto,
        puesto: puestoRelacionado?.nombre_puesto || '-',
        departamento: puestoRelacionado?.departamento || '-',
      }
    })

    setEmpleados(lista)
    setCargando(false)
  }

  async function manejarAgregarRegistro() {
    setMensaje('')

    if (!empleadoSeleccionado) {
      setMensaje('Seleccione un empleado antes de agregar el registro.')
      return
    }

    if (!periodoAdquirido.trim()) {
      setMensaje('Ingrese el período adquirido.')
      return
    }

    if (!fechaInicio || !fechaFin) {
      setMensaje('Complete las fechas de inicio y fin de vacaciones.')
      return
    }

    if (new Date(fechaFin) < new Date(fechaInicio)) {
      setMensaje('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    const nuevoRegistroDB = {
      empleado_id: empleadoSeleccionado.id_empleado,
      empleado_nombre: empleadoSeleccionado.nombre_completo,
      dias_correspondientes: diasCorrespondientes,
      dias_tomados: diasTomados,
      dias_pendientes: diasPendientes,
      periodo_adquirido: periodoAdquirido.trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    }

    const { data, error } = await supabase
      .from('vacaciones_registros')
      .insert([nuevoRegistroDB])
      .select()
      .single()

    if (error || !data) {
      console.error('Error al guardar registro de vacaciones:', error)
      setMensaje(`Error al guardar registro de vacaciones: ${error?.message || 'Error desconocido.'}`)
      return
    }

    const registroInsertado: VacacionRegistro = {
      id: data.id,
      empleadoId: data.empleado_id,
      empleadoNombre: data.empleado_nombre,
      diasCorrespondientes: data.dias_correspondientes,
      diasTomados: data.dias_tomados,
      diasPendientes: data.dias_pendientes,
      periodoAdquirido: data.periodo_adquirido,
      fechaInicio: data.fecha_inicio,
      fechaFin: data.fecha_fin,
    }

    setRegistros((prev) => [registroInsertado, ...prev])
    setMensaje('Registro de vacaciones agregado correctamente.')
    setSelectedEmpleadoId('')
    setPeriodoAdquirido('')
    setDiasTomados(0)
    setFechaInicio('')
    setFechaFin('')
  }

  useEffect(() => {
    if (registroParaImprimir && ejecutarImpresion) {
      window.print()
      setEjecutarImpresion(false)
    }
  }, [registroParaImprimir, ejecutarImpresion])

  function imprimirRegistro(registro: VacacionRegistro) {
    setRegistroParaImprimir(registro)
    setEjecutarImpresion(true)
  }

  return (
    <div className="text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Vacaciones</h2>
        <button
          onClick={() => {
            cargarEmpleados()
            cargarRegistros()
          }}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500"
        >
          Actualizar datos
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Registrar vacaciones</h3>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
              <select
                value={selectedEmpleadoId}
                onChange={(event) => setSelectedEmpleadoId(Number(event.target.value) || '')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              >
                <option value="">Seleccione un empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id_empleado} value={empleado.id_empleado}>
                    {empleado.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
              <input
                type="text"
                value={empleadoSeleccionado?.departamento || ''}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período Adquirido</label>
              <input
                type="text"
                value={periodoAdquirido}
                onChange={(event) => setPeriodoAdquirido(event.target.value)}
                placeholder="Ej. 2024"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días Correspondientes</label>
              <input
                type="number"
                value={diasCorrespondientes}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días Tomados</label>
              <input
                type="number"
                min={0}
                value={diasTomados}
                onChange={(event) => setDiasTomados(Number(event.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días Pendientes</label>
              <input
                type="number"
                value={diasPendientes}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(event) => setFechaInicio(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(event) => setFechaFin(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={manejarAgregarRegistro}
              className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
            >
              Agregar registro
            </button>
          </div>
          </div>

          {registros.length > 0 && (
            <div
              id="vacaciones-registros-print-section"
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm overflow-x-auto"
            >
              <h3 className="text-xl font-semibold mb-4">Registros de vacaciones</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-black">
                    <th className="p-4 text-left border border-gray-200">Empleado</th>
                    <th className="p-4 text-left border border-gray-200">Período Adquirido</th>
                    <th className="p-4 text-right border border-gray-200">Días Correspondientes</th>
                    <th className="p-4 text-right border border-gray-200">Días Tomados</th>
                    <th className="p-4 text-right border border-gray-200">Días Pendientes</th>
                    <th className="p-4 text-left border border-gray-200">Inicio</th>
                    <th className="p-4 text-left border border-gray-200">Fin</th>
                    <th className="p-4 text-center border border-gray-200">Imprimir</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro) => (
                    <tr key={registro.id} className="bg-white text-black">
                      <td className="p-4 border border-gray-200">{registro.empleadoNombre}</td>
                      <td className="p-4 border border-gray-200">{registro.periodoAdquirido}</td>
                      <td className="p-4 border border-gray-200 text-right">{registro.diasCorrespondientes}</td>
                      <td className="p-4 border border-gray-200 text-right">{registro.diasTomados}</td>
                      <td className="p-4 border border-gray-200 text-right">{registro.diasPendientes}</td>
                      <td className="p-4 border border-gray-200">{formatearFecha(registro.fechaInicio)}</td>
                      <td className="p-4 border border-gray-200">{formatearFecha(registro.fechaFin)}</td>
                      <td className="p-4 border border-gray-200 text-center">
                        <button
                          onClick={() => imprimirRegistro(registro)}
                          className="rounded-2xl border border-teal-600 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                        >
                          Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {mensaje && (
          <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {mensaje}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-black">
                <th className="p-4 text-left border border-gray-200">Empleado</th>
                <th className="p-4 text-left border border-gray-200">Puesto</th>
                <th className="p-4 text-left border border-gray-200">Departamento</th>
                <th className="p-4 text-left border border-gray-200">Ingreso</th>
                <th className="p-4 text-left border border-gray-200">Antigüedad</th>
                <th className="p-4 text-right border border-gray-200">Días Vacaciones</th>
                <th className="p-4 text-left border border-gray-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-600">
                    Cargando empleados...
                  </td>
                </tr>
              ) : empleados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-600">
                    No hay empleados registrados todavía.
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => {
                  const antiguedad = calcularAntiguedad(empleado.fecha_ingreso)
                  const diasVacaciones = calcularDiasVacaciones(antiguedad.anios)
                  const textoAntiguedad = antiguedad.anios >= 1
                    ? `${antiguedad.anios} año(s) ${antiguedad.meses} mes(es)`
                    : `${antiguedad.meses} mes(es) ${antiguedad.dias} día(s)`

                  return (
                    <tr key={empleado.id_empleado} className="bg-white text-black">
                      <td className="p-4 border border-gray-200">{empleado.nombre_completo}</td>
                      <td className="p-4 border border-gray-200">{empleado.puesto}</td>
                      <td className="p-4 border border-gray-200">{empleado.departamento}</td>
                      <td className="p-4 border border-gray-200">{formatearFecha(empleado.fecha_ingreso)}</td>
                      <td className="p-4 border border-gray-200">{textoAntiguedad}</td>
                      <td className="p-4 border border-gray-200 text-right">
                        {diasVacaciones > 0 ? diasVacaciones : 'No aplica'}
                      </td>
                      <td className="p-4 border border-gray-200">{empleado.estado_laboral}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        id="vacaciones-text-print-section"
        style={{ display: 'none' }}
      >
        {registroParaImprimir && (
          <div className="vacaciones-print-container">
            <div className="vacaciones-print-header">
              <div className="vacaciones-print-logo">
                <img
                  src="/Ferreteríalogo.PNG" alt="Logo Ferretería Prois"
                  style={{ width: 110, height: 90, objectFit: 'contain' }}
                />
              </div>
              <div className="vacaciones-print-header-text">
                <div className="vacaciones-print-title">FERRETERÍA PROIS</div>
                <div className="vacaciones-print-subtitle">SOLICITUD Y CONSTANCIA DE VACACIONES</div>
                <div className="vacaciones-print-meta">
                  <span>CODIGO: {registroParaImprimir.id}</span>
                  <span>FECHA: {formatearFecha(new Date().toISOString().slice(0, 10))}</span>
                </div>
              </div>
            </div>

            <div className="vacaciones-print-section">
              <div className="vacaciones-print-row">
                <div className="vacaciones-print-field">
                  <span className="vacaciones-print-label">NOMBRE:</span>
                  <span className="vacaciones-print-value">{registroParaImprimir.empleadoNombre}</span>
                </div>
                <div className="vacaciones-print-field">
                  <span className="vacaciones-print-label">PERIODO:</span>
                  <span className="vacaciones-print-value">{registroParaImprimir.periodoAdquirido}</span>
                </div>
              </div>

              <div className="vacaciones-print-row">
                <div className="vacaciones-print-field">
                  <span className="vacaciones-print-label">FECHA DE INGRESO:</span>
                  <span className="vacaciones-print-value">{formatearFecha(registroParaImprimir.fechaInicio)}</span>
                </div>
                <div className="vacaciones-print-field">
                  <span className="vacaciones-print-label">DEPARTAMENTO:</span>
                  <span className="vacaciones-print-value">--</span>
                </div>
              </div>

             
            </div>

            <div className="vacaciones-print-box">
              <div className="vacaciones-print-box-row">
                <div>
                  <span className="vacaciones-print-label">NO. DE DÍAS SOLICITADOS: </span>
                  <span className="vacaciones-print-value">{registroParaImprimir.diasTomados}</span>
                </div>
                <div>
                  <span className="vacaciones-print-letras">Por medio de la presente, le informamos que su solicitud de permiso correspondiente</span>
                  <span className="vacaciones-print-value"></span>
                </div>
              </div>

              <div className="vacaciones-print-box-row">
                <div>
                  <span className="vacaciones-print-label">DESDE EL DÍA: </span>
                  <span className="vacaciones-print-value">{formatearFecha(registroParaImprimir.fechaInicio)}</span>
                  <span className="vacaciones-print-label">  HASTA EL: </span>
                  <span className="vacaciones-print-value">{formatearFecha(registroParaImprimir.fechaFin)}</span><span className='vacaciones-print-letras'> han sido aprobada. El permiso tendrá una duración de {registroParaImprimir.diasTomados}</span>
                </div>
             
                <div>
                  <span className="vacaciones-print-letras">
                  No obstante, le rogamos que se asegure de que todas las tareas pendientes queden finalizadas y facilite la información necesaria para la correcta entrega de las mismas, antes del inicio de su permiso.
                  </span>
                </div>
              </div>

              <div className="vacaciones-print-box-row">
                <div>
                  <span className="vacaciones-print-label">PERIODO VACACIONAL: </span>
                  <span className="vacaciones-print-value">{registroParaImprimir.periodoAdquirido}</span>
                </div>
              </div>
            </div>

            <div className="vacaciones-print-text-block">
              Hago constar que las vacaciones a que tengo derecho como consecuencia del contrato individual de trabajo celebrado con esta empresa, me serán otorgados con apego al art. 346 del Código del Trabajo y que me corresponden por ley.
            </div>

            <div className="vacaciones-print-signatures">
              <div>
                <div className="vacaciones-print-signature-line"></div>
                <div>Solicita:__________________</div>
              </div>
              <div>
                <div className="vacaciones-print-signature-line"></div>
                <div>Autoriza:__________________</div>
              </div>
            </div>

            <div className="vacaciones-print-roles">
              <div>Empleado</div>
              <div>Jefe Inmediato</div>
            </div>

            <div className="vacaciones-print-summary-grid">
              <div>
                <span className="vacaciones-print-label">DÍAS QUE CORRESPONDE: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.diasCorrespondientes}</span>
              </div>
              <div>
                <span className="vacaciones-print-label">PERIODO: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.periodoAdquirido}</span>
              </div>
              <div>
                <span className="vacaciones-print-label">DÍAS: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.diasTomados}</span>
              </div>
              <div>
                <span className="vacaciones-print-label">DÍAS A DISFRUTAR: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.diasTomados}</span>
              </div>
              <div>
                <span className="vacaciones-print-label">DÍAS PENDIENTES: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.diasPendientes}</span>
              </div>
              <div>
                <span className="vacaciones-print-label">TOTAL DE DÍAS: </span>
                <span className="vacaciones-print-value">{registroParaImprimir.diasCorrespondientes}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        #vacaciones-text-print-section {
          display: none;
        }

        .vacaciones-print-container {
          font-family: Arial, sans-serif;
          color: #111111;
          line-height: 1.3;
        }

        .vacaciones-print-header {
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
        }

        .vacaciones-print-header-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }

        .vacaciones-print-logo-box {
          width: 110px;
          height: 70px;
          border: 2px solid #000;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .vacaciones-print-title {
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
          text-align: center;
        }

        .vacaciones-print-subtitle {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 10px;
          text-align: center;
        }

        .vacaciones-print-meta {
          display: flex;
          gap: 24px;
          font-size: 11px;
          font-weight: 700;
          justify-content: flex-start;
          width: 100%;
        }

        .vacaciones-print-section,
        .vacaciones-print-box,
        .vacaciones-print-summary-grid {
          border: 1px solid #000;
          padding: 12px;
          margin-bottom: 14px;
        }

        .vacaciones-print-row,
        .vacaciones-print-box-row,
        .vacaciones-print-roles {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .vacaciones-print-field {
          flex: 1 1 280px;
          display: flex;
          gap: 8px;
          align-items: center;
          border-bottom: 1px dotted #333;
          padding: 6px 0;
        }

        .vacaciones-print-wide {
          flex: 1 1 100%;
        }

        .vacaciones-print-label {
          min-width: 160px;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
        }

        .vacaciones-print-value {
          flex: 1;
          font-size: 11px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          display: inline-block;
        }

        .vacaciones-print-box-row > div {
          flex: 1 1 50%;
          font-size: 11px;
        }

         .vacaciones-print-letras {
          font-size: 13px;
          padding: 10px;
          min-height: 64px;
          text-align: justify;
          padding-left: 0;
          margin-left: 0;
        }

        .vacaciones-print-text-block {
          font-size: 11px;
          padding: 12px;
          border: 1px solid #000;
          margin-bottom: 16px;
          min-height: 74px;
        }

        .vacaciones-print-signatures {
          display: flex;
          gap: 24px;
          margin-bottom: 10px;
        }

        .vacaciones-print-signature-line {
          height: 1px;
          background: #000;
          margin-bottom: 8px;
        }

        .vacaciones-print-signatures > div {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 6px;
          min-height: 300px;
        }

        .vacaciones-print-roles {
          justify-content: space-between;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .vacaciones-print-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          font-size: 11px;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #vacaciones-text-print-section,
          #vacaciones-text-print-section * {
            visibility: visible;
          }

          #vacaciones-text-print-section {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            box-sizing: border-box;
            background: white;
          }

          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
