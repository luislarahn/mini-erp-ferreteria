'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Puesto = {
  id_puesto: number
  nombre_puesto: string
  prefijo_puesto: string
  salario_base: number
}

type Empleado = {
  id_empleado: number
  dni_empleado: string
  codigo_empleado: string
  nombre_completo: string
  fecha_nacimiento: string | null
  genero: 'Hombre' | 'Mujer'
  estado_civil: 'Soltero' | 'Casado' | 'Union libre'
  profesion: string | null
  salario: number
  fecha_ingreso: string
  estado_laboral: 'Activo' | 'Despedido' | 'Retirado'
  id_puesto: number
  puestos?: { nombre_puesto: string }[] | null
}

function hoyLocal() {
  return new Date().toISOString().split('T')[0]
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function generarPrefijoBase(nombrePuesto: string) {
  const limpio = nombrePuesto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .trim()

  if (!limpio) return 'EP'

  const palabras = limpio.split(/\s+/).filter(Boolean)
  const inicial = palabras[0]?.[0] || 'P'

  return `E${inicial}`
}

function generarPrefijoDisponible(nombrePuesto: string, puestos: Puesto[]) {
  const base = generarPrefijoBase(nombrePuesto)
  const existentes = new Set(puestos.map((p) => p.prefijo_puesto.toUpperCase()))

  if (!existentes.has(base)) return base

  let contador = 2
  while (existentes.has(`${base}${contador}`)) {
    contador++
  }

  return `${base}${contador}`
}

export default function PersonalTab() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [dniEmpleado, setDniEmpleado] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState<'Hombre' | 'Mujer'>('Hombre')
  const [estadoCivil, setEstadoCivil] = useState<'Soltero' | 'Casado' | 'Union libre'>('Soltero')
  const [profesion, setProfesion] = useState('')
  const [puestoInput, setPuestoInput] = useState('')
  const [salario, setSalario] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState(hoyLocal())
  const [estadoLaboral, setEstadoLaboral] = useState<'Activo' | 'Despedido' | 'Retirado'>('Activo')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setMensaje('')

    try {
      const [puestosRes, empleadosRes] = await Promise.all([
        supabase.from('puestos').select('*').order('id_puesto', { ascending: true }),

        supabase
          .from('empleados')
          .select(`
            id_empleado,
            dni_empleado,
            codigo_empleado,
            nombre_completo,
            fecha_nacimiento,
            genero,
            estado_civil,
            profesion,
            salario,
            fecha_ingreso,
            estado_laboral,
            id_puesto,
            puestos(nombre_puesto)
          `)
          .order('id_empleado', { ascending: false }),
      ])

      if (puestosRes.error) throw puestosRes.error
      if (empleadosRes.error) throw empleadosRes.error

      const puestosData: Puesto[] = (puestosRes.data || []).map((p: any) => ({
        id_puesto: p.id_puesto,
        nombre_puesto: p.nombre_puesto,
        prefijo_puesto: p.prefijo_puesto,
        salario_base: Number(p.salario_base || 0),
      }))

      const empleadosData: Empleado[] = (empleadosRes.data || []).map((e: any) => ({
        id_empleado: e.id_empleado,
        dni_empleado: e.dni_empleado,
        codigo_empleado: e.codigo_empleado,
        nombre_completo: e.nombre_completo,
        fecha_nacimiento: e.fecha_nacimiento || null,
        genero: e.genero,
        estado_civil: e.estado_civil,
        profesion: e.profesion || null,
        salario: Number(e.salario || 0),
        fecha_ingreso: e.fecha_ingreso,
        estado_laboral: e.estado_laboral,
        id_puesto: e.id_puesto,
        puestos: Array.isArray(e.puestos)
          ? e.puestos
          : e.puestos
            ? [e.puestos]
            : [],
      }))

      setPuestos(puestosData)
      setEmpleados(empleadosData)
    } catch (error: any) {
      console.log('Error al cargar personal:', error)
      setMensaje(`Error al cargar datos: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setCargando(false)
    }
  }

  function limpiarFormulario() {
    setDniEmpleado('')
    setNombreCompleto('')
    setFechaNacimiento('')
    setGenero('Hombre')
    setEstadoCivil('Soltero')
    setProfesion('')
    setPuestoInput('')
    setSalario('')
    setFechaIngreso(hoyLocal())
    setEstadoLaboral('Activo')
  }

  const puestoExistente = useMemo(() => {
    return puestos.find(
      (p) => normalizarTexto(p.nombre_puesto) === normalizarTexto(puestoInput)
    )
  }, [puestoInput, puestos])

  const codigoPreview = useMemo(() => {
    if (!puestoInput.trim()) return 'Se genera al guardar'

    if (puestoExistente) {
      const correlativo =
        empleados.filter((e) => e.id_puesto === puestoExistente.id_puesto).length + 1
      return `${puestoExistente.prefijo_puesto}-${String(correlativo).padStart(2, '0')}`
    }

    const prefijoNuevo = generarPrefijoDisponible(puestoInput, puestos)
    return `${prefijoNuevo}-01`
  }, [puestoInput, puestoExistente, empleados, puestos])

  function manejarCambioPuesto(valor: string) {
    setPuestoInput(valor)

    const encontrado = puestos.find(
      (p) => normalizarTexto(p.nombre_puesto) === normalizarTexto(valor)
    )

    if (encontrado) {
      setSalario(String(Number(encontrado.salario_base || 0)))
    }
  }

  async function guardarEmpleado() {
    setMensaje('')

    const dni = dniEmpleado.trim()
    const nombre = nombreCompleto.trim()
    const profesionTexto = profesion.trim()
    const puestoTexto = puestoInput.trim()
    const salarioNumero = Number(salario)

    if (!dni) {
      setMensaje('Debe ingresar el DNI del empleado.')
      return
    }

    if (!nombre) {
      setMensaje('Debe ingresar el nombre completo del empleado.')
      return
    }

    if (!puestoTexto) {
      setMensaje('Debe ingresar o seleccionar un puesto.')
      return
    }

    if (Number.isNaN(salarioNumero) || salarioNumero < 0) {
      setMensaje('Debe ingresar un salario válido.')
      return
    }

    setGuardando(true)

    try {
      const { data: empleadoDniExistente, error: errorDni } = await supabase
        .from('empleados')
        .select('id_empleado')
        .eq('dni_empleado', dni)
        .limit(1)

      if (errorDni) throw errorDni

      if (empleadoDniExistente && empleadoDniExistente.length > 0) {
        setMensaje('Ya existe un empleado con ese DNI.')
        setGuardando(false)
        return
      }

      let puestoId = puestoExistente?.id_puesto || null
      let prefijoPuesto = puestoExistente?.prefijo_puesto || ''

      if (!puestoId) {
        const prefijoNuevo = generarPrefijoDisponible(puestoTexto, puestos)

        const { data: puestoCreado, error: errorPuesto } = await supabase
          .from('puestos')
          .insert([
            {
              nombre_puesto: puestoTexto,
              prefijo_puesto: prefijoNuevo,
              salario_base: salarioNumero,
            },
          ])
          .select()
          .single()

        if (errorPuesto) throw errorPuesto

        puestoId = puestoCreado.id_puesto
        prefijoPuesto = puestoCreado.prefijo_puesto
      }

      const correlativo =
        empleados.filter((e) => e.id_puesto === puestoId).length + 1

      const codigoEmpleado = `${prefijoPuesto}-${String(correlativo).padStart(2, '0')}`

      const { error: errorEmpleado } = await supabase.from('empleados').insert([
        {
          dni_empleado: dni,
          codigo_empleado: codigoEmpleado,
          nombre_completo: nombre,
          fecha_nacimiento: fechaNacimiento || null,
          genero,
          estado_civil: estadoCivil,
          profesion: profesionTexto || null,
          salario: salarioNumero,
          fecha_ingreso: fechaIngreso,
          estado_laboral: estadoLaboral,
          id_puesto: puestoId,
        },
      ])

      if (errorEmpleado) throw errorEmpleado

      setMensaje(`Empleado guardado correctamente con código ${codigoEmpleado}.`)
      limpiarFormulario()
      await cargarDatos()
    } catch (error: any) {
      console.log('Error al guardar empleado:', error)
      setMensaje(`Error al guardar empleado: ${error?.message || 'Error inesperado.'}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Personal</h2>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 underline mb-6">
            Nuevo Registro
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-black">DNI Empleado:</label>
              <input
                type="text"
                value={dniEmpleado}
                onChange={(e) => setDniEmpleado(e.target.value)}
                placeholder="0000-0000-00000"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Código Empleado:</label>
              <input
                type="text"
                value={codigoPreview}
                readOnly
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Nombre Completo:</label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Nombre del empleado"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Fecha de nacimiento:</label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-black">Género:</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value as 'Hombre' | 'Mujer')}
                  className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
                >
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-black">Estado Civil:</label>
                <select
                  value={estadoCivil}
                  onChange={(e) =>
                    setEstadoCivil(e.target.value as 'Soltero' | 'Casado' | 'Union libre')
                  }
                  className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
                >
                  <option value="Soltero">Soltero</option>
                  <option value="Casado">Casado</option>
                  <option value="Union libre">Union libre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-black">Profesión:</label>
              <input
                type="text"
                value={profesion}
                onChange={(e) => setProfesion(e.target.value)}
                placeholder="Profesión del empleado"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Puesto:</label>
              <input
                type="text"
                list="lista-puestos"
                value={puestoInput}
                onChange={(e) => manejarCambioPuesto(e.target.value)}
                placeholder="Escriba o seleccione un puesto"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
              <datalist id="lista-puestos">
                {puestos.map((puesto) => (
                  <option key={puesto.id_puesto} value={puesto.nombre_puesto} />
                ))}
              </datalist>

              {!puestoExistente && puestoInput.trim() !== '' && (
                <p className="text-xs text-amber-600 mt-2">
                  Ese puesto no existe todavía. Se creará automáticamente al guardar.
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-black">Salario:</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                placeholder="Ejemplo: 12000"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Fecha de ingreso:</label>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Estado:</label>
              <select
                value={estadoLaboral}
                onChange={(e) =>
                  setEstadoLaboral(e.target.value as 'Activo' | 'Despedido' | 'Retirado')
                }
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black"
              >
                <option value="Activo">Activo</option>
                <option value="Despedido">Despedido</option>
                <option value="Retirado">Retirado</option>
              </select>
            </div>

            {mensaje && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
                {mensaje}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={guardarEmpleado}
                disabled={guardando}
                className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Empleado'}
              </button>

              <button
                onClick={limpiarFormulario}
                type="button"
                className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-semibold"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-gray-50 border border-gray-300 rounded-2xl p-4 shadow-sm">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black">
                  <th className="p-4 text-left border border-gray-200">DNI</th>
                  <th className="p-4 text-left border border-gray-200">Código</th>
                  <th className="p-4 text-left border border-gray-200">Nombre</th>
                  <th className="p-4 text-left border border-gray-200">Puesto</th>
                  <th className="p-4 text-right border border-gray-200">Salario</th>
                  <th className="p-4 text-center border border-gray-200">Ingreso</th>
                  <th className="p-4 text-center border border-gray-200">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-600 bg-white">
                      Cargando empleados...
                    </td>
                  </tr>
                ) : empleados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-600 bg-white">
                      No hay empleados registrados todavía.
                    </td>
                  </tr>
                ) : (
                  empleados.map((empleado) => (
                    <tr key={empleado.id_empleado} className="bg-white text-black">
                      <td className="p-4 border border-gray-200">{empleado.dni_empleado}</td>
                      <td className="p-4 border border-gray-200">{empleado.codigo_empleado}</td>
                      <td className="p-4 border border-gray-200">{empleado.nombre_completo}</td>
                      <td className="p-4 border border-gray-200">
                        {empleado.puestos?.[0]?.nombre_puesto || '-'}
                      </td>
                      <td className="p-4 border border-gray-200 text-right">
                        L {Number(empleado.salario || 0).toFixed(2)}
                      </td>
                      <td className="p-4 border border-gray-200 text-center">
                        {formatearFecha(empleado.fecha_ingreso)}
                      </td>
                      <td className="p-4 border border-gray-200 text-center">
                        {empleado.estado_laboral}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}