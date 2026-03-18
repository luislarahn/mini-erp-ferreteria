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
    <div>
      <h2 className="text-2xl font-bold mb-4">Registro de Clientes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Nombre de Cliente</label>
          <input
            type="text"
            name="nombre_cliente"
            value={formulario.nombre_cliente}
            onChange={manejarCambio}
            placeholder="Nombre del cliente"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">RTN</label>
          <input
            type="text"
            name="rtn"
            value={formulario.rtn}
            onChange={manejarCambio}
            placeholder="RTN"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Dirección</label>
          <input
            type="text"
            name="direccion"
            value={formulario.direccion}
            onChange={manejarCambio}
            placeholder="Dirección"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Correo</label>
          <input
            type="email"
            name="correo"
            value={formulario.correo}
            onChange={manejarCambio}
            placeholder="correo@ejemplo.com"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={formulario.telefono}
            onChange={manejarCambio}
            placeholder="9999-9999"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Nombre de Contacto</label>
          <input
            type="text"
            name="nombre_contacto"
            value={formulario.nombre_contacto}
            onChange={manejarCambio}
            placeholder="Persona de contacto"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
          />
        </div>
      </div>

      {mensaje && (
        <div className="mt-4 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm">
          {mensaje}
        </div>
      )}

      <button
        onClick={guardarCliente}
        disabled={cargando}
        className="mt-6 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Guardar cliente'}
      </button>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Clientes registrados</h3>

        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full border-collapse">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left border border-slate-700">Nombre</th>
                <th className="p-3 text-left border border-slate-700">RTN</th>
                <th className="p-3 text-left border border-slate-700">Teléfono</th>
                <th className="p-3 text-left border border-slate-700">Correo</th>
                <th className="p-3 text-left border border-slate-700">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center border border-slate-700 text-slate-400"
                  >
                    No hay clientes registrados todavía.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id_cliente} className="bg-slate-900">
                    <td className="p-3 border border-slate-700">
                      {cliente.nombre_cliente}
                    </td>
                    <td className="p-3 border border-slate-700">
                      {cliente.rtn || '-'}
                    </td>
                    <td className="p-3 border border-slate-700">
                      {cliente.telefono || '-'}
                    </td>
                    <td className="p-3 border border-slate-700">
                      {cliente.correo || '-'}
                    </td>
                    <td className="p-3 border border-slate-700">
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
  )
}