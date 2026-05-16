'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Puesto = {
  id_puesto: number
  nombre_puesto: string
  prefijo_puesto: string
  salario_base: number
  departamento: string
  created_at?: string
}

export default function PuestosSalariosTab() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [nombrePuesto, setNombrePuesto] = useState('')
  const [prefijoPuesto, setPrefijoPuesto] = useState('')
  const [salarioBase, setSalarioBase] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)

  useEffect(() => {
    cargarPuestos()
  }, [])

  async function cargarPuestos() {
    setCargando(true)

    const { data, error } = await supabase
      .from('puestos')
      .select('*')
      .order('id_puesto', { ascending: true })

    if (error) {
      console.log('Error al cargar puestos:', error)
      setMensaje(`Error al cargar puestos: ${error.message}`)
      setCargando(false)
      return
    }

    setPuestos(data || [])
    setCargando(false)
  }

  function limpiarFormulario() {
    setNombrePuesto('')
    setPrefijoPuesto('')
    setSalarioBase('')
    setDepartamento('')
    setEditandoId(null)
  }



  async function guardarPuesto() {
    setMensaje('')

    const nombre = nombrePuesto.trim()
    const prefijo = prefijoPuesto.trim().toUpperCase()
    const salario = Number(salarioBase)
    const dept = departamento.trim()

    if (!nombre) {
      setMensaje('Debe ingresar el nombre del puesto.')
      return
    }

    if (!dept) {
      setMensaje('Debe ingresar el departamento.')
      return
    }

    if (!prefijo) {
      setMensaje('Debe ingresar el prefijo del puesto.')
      return
    }

    if (Number.isNaN(salario) || salario < 0) {
      setMensaje('Debe ingresar un salario válido.')
      return
    }

    setCargando(true)

    const { error } = await supabase.from('puestos').insert([
      {
        nombre_puesto: nombre,
        prefijo_puesto: prefijo,
        salario_base: salario,
        departamento: dept,
      },
    ])

    if (error) {
      console.log('Error al guardar puesto:', error)
      setMensaje(`Error al guardar puesto: ${error.message}`)
      setCargando(false)
      return
    }

    setMensaje('Puesto guardado correctamente.')
    limpiarFormulario()
    await cargarPuestos()
  }

  async function eliminarPuesto(id: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar este puesto?')) return

    setCargando(true)

    const { error } = await supabase.from('puestos').delete().eq('id_puesto', id)

    if (error) {
      console.log('Error al eliminar puesto:', error)
      setMensaje(`Error al eliminar puesto: ${error.message}`)
    } else {
      setMensaje('Puesto eliminado correctamente.')
      await cargarPuestos()
    }

    setCargando(false)
  }

  async function editarPuesto(puesto: Puesto) {
    setEditandoId(puesto.id_puesto)
    setNombrePuesto(puesto.nombre_puesto)
    setPrefijoPuesto(puesto.prefijo_puesto)
    setSalarioBase(puesto.salario_base.toString())
    setDepartamento(puesto.departamento)
    setMensaje('Puesto editado correctamente')
  }

  async function actualizarPuesto() {
    if (!editandoId) return

    const nombre = nombrePuesto.trim()
    const prefijo = prefijoPuesto.trim().toUpperCase()
    const salario = Number(salarioBase)
    const dept = departamento.trim()

    if (!nombre) {
      setMensaje('Debe ingresar el nombre del puesto.')
      return
    }

    if (!dept) {
      setMensaje('Debe ingresar el departamento.')
      return
    }

    if (!prefijo) {
      setMensaje('Debe ingresar el prefijo del puesto.')
      return
    }

    if (Number.isNaN(salario) || salario < 0) {
      setMensaje('Debe ingresar un salario válido.')
      return
    }

    setCargando(true)

    const { error } = await supabase.from('puestos').update({
      nombre_puesto: nombre,
      prefijo_puesto: prefijo,
      salario_base: salario,
      departamento: dept,
    }).eq('id_puesto', editandoId)

    if (error) {
      console.log('Error al actualizar puesto:', error)
      setMensaje(`Error al actualizar puesto: ${error.message}`)
    } else {
      setMensaje('Puesto actualizado correctamente.')
      setEditandoId(null)
      limpiarFormulario()
      await cargarPuestos()
    }

    setCargando(false)
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Puestos y Salarios</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 underline mb-6">
            {editandoId ? 'Editar Puesto' : 'Nuevo Puesto'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-black">Nombre del puesto:</label>
              <input
                type="text"
                value={nombrePuesto}
                onChange={(e) => setNombrePuesto(e.target.value)}
                placeholder="Ejemplo: Contabilidad"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Departamento:</label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ejemplo: Finanzas"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Prefijo del puesto:</label>
              <input
                type="text"
                value={prefijoPuesto}
                onChange={(e) => setPrefijoPuesto(e.target.value)}
                placeholder="Ejemplo: ECO"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Salario Base:</label>
              <input
                type="number"
                value={salarioBase}
                onChange={(e) => setSalarioBase(e.target.value)}
                placeholder="Ejemplo: 14000"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={editandoId ? actualizarPuesto : guardarPuesto}
                disabled={cargando}
                className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {cargando ? (editandoId ? 'Actualizando...' : 'Guardando...') : (editandoId ? 'Actualizar puesto' : 'Guardar puesto')}
              </button>

              {editandoId && (
                <button
                  onClick={() => { setEditandoId(null); limpiarFormulario(); }}
                  type="button"
                  className="px-4 py-3 rounded-lg bg-red-200 hover:bg-red-300 text-black font-semibold"
                >
                  Cancelar
                </button>
              )}

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

        <div className="lg:col-span-3 bg-gray-50 border border-gray-300 rounded-2xl p-4 shadow-sm">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black">
                  <th className="p-4 text-left border border-gray-200">ID</th>
                  <th className="p-4 text-left border border-gray-200">Puesto</th>
                  <th className="p-4 text-left border border-gray-200">Departamento</th>
                  <th className="p-4 text-left border border-gray-200">Prefijo</th>
                  <th className="p-4 text-right border border-gray-200">Salario Base</th>
                  <th className="p-4 text-center border border-gray-200"></th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-600 bg-white">
                      Cargando puestos...
                    </td>
                  </tr>
                ) : puestos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-600 bg-white">
                      No hay puestos registrados todavía.
                    </td>
                  </tr>
                ) : (
                  puestos.map((puesto) => (
                    <tr key={puesto.id_puesto} className="bg-white text-black">
                      <td className="p-4 border border-gray-200">{puesto.id_puesto}</td>
                      <td className="p-4 border border-gray-200">{puesto.nombre_puesto}</td>
                      <td className="p-4 border border-gray-200">{puesto.departamento}</td>
                      <td className="p-4 border border-gray-200">{puesto.prefijo_puesto}</td>
                      <td className="p-4 border border-gray-200 text-right">
                        L {Number(puesto.salario_base || 0).toFixed(2)}
                      </td>
                      <td className="p-4 border border-gray-200 text-center relative">
                        <button 
                          onClick={() => setDropdownOpen(dropdownOpen === puesto.id_puesto ? null : puesto.id_puesto)} 
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm"
                        >
                          ⋮
                        </button>
                        {dropdownOpen === puesto.id_puesto && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded shadow-lg z-10">
                            <button 
                              onClick={() => { editarPuesto(puesto); setDropdownOpen(null); }} 
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => { eliminarPuesto(puesto.id_puesto); setDropdownOpen(null); }} 
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
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