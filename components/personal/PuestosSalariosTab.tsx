'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Puesto = {
  id_puesto: number
  nombre_puesto: string
  prefijo_puesto: string
  salario_base: number
  created_at?: string
}

export default function PuestosSalariosTab() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [nombrePuesto, setNombrePuesto] = useState('')
  const [prefijoPuesto, setPrefijoPuesto] = useState('')
  const [salarioBase, setSalarioBase] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

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
  }

  async function guardarPuesto() {
    setMensaje('')

    const nombre = nombrePuesto.trim()
    const prefijo = prefijoPuesto.trim().toUpperCase()
    const salario = Number(salarioBase)

    if (!nombre) {
      setMensaje('Debe ingresar el nombre del puesto.')
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

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Puestos y Salarios</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 underline mb-6">
            Nuevo Puesto
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

            {mensaje && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
                {mensaje}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={guardarPuesto}
                disabled={cargando}
                className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Guardar puesto'}
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

        <div className="lg:col-span-3 bg-gray-50 border border-gray-300 rounded-2xl p-4 shadow-sm">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black">
                  <th className="p-4 text-left border border-gray-200">ID</th>
                  <th className="p-4 text-left border border-gray-200">Puesto</th>
                  <th className="p-4 text-left border border-gray-200">Prefijo</th>
                  <th className="p-4 text-right border border-gray-200">Salario Base</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-600 bg-white">
                      Cargando puestos...
                    </td>
                  </tr>
                ) : puestos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-600 bg-white">
                      No hay puestos registrados todavía.
                    </td>
                  </tr>
                ) : (
                  puestos.map((puesto) => (
                    <tr key={puesto.id_puesto} className="bg-white text-black">
                      <td className="p-4 border border-gray-200">{puesto.id_puesto}</td>
                      <td className="p-4 border border-gray-200">{puesto.nombre_puesto}</td>
                      <td className="p-4 border border-gray-200">{puesto.prefijo_puesto}</td>
                      <td className="p-4 border border-gray-200 text-right">
                        L {Number(puesto.salario_base || 0).toFixed(2)}
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