'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id_cliente: number
  nombre_cliente: string
  rtn: string | null
  direccion: string | null
  correo: string | null
  telefono: string | null
  nombre_contacto: string | null
  fecha_registro: string
}

export default function ClientesTab() {
  const [formulario, setFormulario] = useState({
    nombre_cliente: '',
    rtn: '',
    direccion: '',
    correo: '',
    telefono: '',
    nombre_contacto: ''
  })

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id_cliente', { ascending: false })

    if (error) {
      console.error('Error al cargar clientes:', error.message)
      return
    }

    setClientes(data || [])
  }

  function manejarCambio(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target
    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  async function guardarCliente() {
    setMensaje('')

    if (!formulario.nombre_cliente.trim()) {
      setMensaje('El nombre del cliente es obligatorio.')
      return
    }

    setCargando(true)

    try {
      if (formulario.rtn.trim() !== '') {
        const { data: existenteRTN, error: errorRTN } = await supabase
          .from('clientes')
          .select('id_cliente')
          .eq('rtn', formulario.rtn.trim())
          .limit(1)

        if (errorRTN) {
          throw errorRTN
        }

        if (existenteRTN && existenteRTN.length > 0) {
          setMensaje('Ya existe un cliente con ese RTN.')
          setCargando(false)
          return
        }
      }

      const { error } = await supabase.from('clientes').insert([
        {
          nombre_cliente: formulario.nombre_cliente.trim(),
          rtn: formulario.rtn.trim() || null,
          direccion: formulario.direccion.trim() || null,
          correo: formulario.correo.trim() || null,
          telefono: formulario.telefono.trim() || null,
          nombre_contacto: formulario.nombre_contacto.trim() || null
        }
      ])

      if (error) {
        throw error
      }

      setMensaje('Cliente guardado correctamente.')

      setFormulario({
        nombre_cliente: '',
        rtn: '',
        direccion: '',
        correo: '',
        telefono: '',
        nombre_contacto: ''
      })

      await cargarClientes()
    } catch (error: any) {
      console.error(error)
      setMensaje(`Error al guardar cliente: ${error.message}`)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Registro de Clientes</h2>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 underline mb-6">
            Nuevo Cliente
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-black">Nombre de Cliente:</label>
              <input
                type="text"
                name="nombre_cliente"
                value={formulario.nombre_cliente}
                onChange={manejarCambio}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">RTN:</label>
              <input
                type="text"
                name="rtn"
                value={formulario.rtn}
                onChange={manejarCambio}
                placeholder="RTN"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Dirección:</label>
              <input
                type="text"
                name="direccion"
                value={formulario.direccion}
                onChange={manejarCambio}
                placeholder="Dirección"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Correo:</label>
              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={manejarCambio}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Teléfono:</label>
              <input
                type="text"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
                placeholder="9999-9999"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Nombre de Contacto:</label>
              <input
                type="text"
                name="nombre_contacto"
                value={formulario.nombre_contacto}
                onChange={manejarCambio}
                placeholder="Persona de contacto"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            {mensaje && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
                {mensaje}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={guardarCliente}
                disabled={cargando}
                className="w-full px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-gray-50 border border-gray-300 rounded-2xl p-4 shadow-sm">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left border border-gray-200 text-black">Nombre</th>
                  <th className="p-3 text-left border border-gray-200 text-black">RTN</th>
                  <th className="p-3 text-left border border-gray-200 text-black">Teléfono</th>
                  <th className="p-3 text-left border border-gray-200 text-black">Correo</th>
                  <th className="p-3 text-left border border-gray-200 text-black">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center border border-gray-200 text-gray-500 bg-white"
                    >
                      No hay clientes registrados todavía.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id_cliente} className="bg-white text-black">
                      <td className="p-3 border border-gray-200">
                        {cliente.nombre_cliente}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {cliente.rtn || '-'}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {cliente.telefono || '-'}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {cliente.correo || '-'}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {cliente.nombre_contacto || '-'}
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