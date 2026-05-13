'use client'

import { useEffect, useMemo, useState } from 'react'
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

type FormularioCliente = {
  nombre_cliente: string
  rtn: string
  direccion: string
  correo: string
  telefono: string
  nombre_contacto: string
}

function formularioVacio(): FormularioCliente {
  return {
    nombre_cliente: '',
    rtn: '',
    direccion: '',
    correo: '',
    telefono: '',
    nombre_contacto: '',
  }
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return '-'

  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function normalizarTexto(texto: string | null | undefined) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
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

export default function ClientesTab() {
  const [formulario, setFormulario] = useState<FormularioCliente>(formularioVacio())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(false)
  const [cargandoClientes, setCargandoClientes] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [idClienteEditando, setIdClienteEditando] = useState<number | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    setCargandoClientes(true)

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id_cliente', { ascending: false })

    if (error) {
      console.error('Error al cargar clientes:', error.message)
      setMensaje(`Error al cargar clientes: ${obtenerMensajeError(error)}`)
      setCargandoClientes(false)
      return
    }

    setClientes(data || [])
    setCargandoClientes(false)
  }

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function limpiarFormulario() {
    setFormulario(formularioVacio())
    setIdClienteEditando(null)
    setMensaje('')
  }

  async function validarRTNDuplicado(rtn: string, idActual?: number | null) {
    if (rtn.trim() === '') return false

    let consulta = supabase
      .from('clientes')
      .select('id_cliente')
      .eq('rtn', rtn.trim())
      .limit(1)

    if (idActual) {
      consulta = consulta.neq('id_cliente', idActual)
    }

    const { data, error } = await consulta

    if (error) {
      throw error
    }

    return Boolean(data && data.length > 0)
  }

  async function guardarCliente() {
    setMensaje('')

    if (!formulario.nombre_cliente.trim()) {
      setMensaje('El nombre del cliente es obligatorio.')
      return
    }

    setCargando(true)

    try {
      const rtnDuplicado = await validarRTNDuplicado(formulario.rtn, idClienteEditando)

      if (rtnDuplicado) {
        setMensaje('Ya existe un cliente con ese RTN.')
        setCargando(false)
        return
      }

      if (idClienteEditando) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre_cliente: formulario.nombre_cliente.trim(),
            rtn: formulario.rtn.trim() || null,
            direccion: formulario.direccion.trim() || null,
            correo: formulario.correo.trim() || null,
            telefono: formulario.telefono.trim() || null,
            nombre_contacto: formulario.nombre_contacto.trim() || null,
          })
          .eq('id_cliente', idClienteEditando)

        if (error) throw error

        setMensaje('Cliente actualizado correctamente.')
      } else {
        const { error } = await supabase.from('clientes').insert([
          {
            nombre_cliente: formulario.nombre_cliente.trim(),
            rtn: formulario.rtn.trim() || null,
            direccion: formulario.direccion.trim() || null,
            correo: formulario.correo.trim() || null,
            telefono: formulario.telefono.trim() || null,
            nombre_contacto: formulario.nombre_contacto.trim() || null,
          },
        ])

        if (error) throw error

        setMensaje('Cliente guardado correctamente.')
      }

      setFormulario(formularioVacio())
      setIdClienteEditando(null)
      await cargarClientes()
    } catch (error: any) {
      console.error(error)
      setMensaje(`Error al guardar cliente: ${obtenerMensajeError(error)}`)
    } finally {
      setCargando(false)
    }
  }

  function cargarClienteParaModificar(cliente: Cliente) {
    setIdClienteEditando(cliente.id_cliente)
    setFormulario({
      nombre_cliente: cliente.nombre_cliente || '',
      rtn: cliente.rtn || '',
      direccion: cliente.direccion || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      nombre_contacto: cliente.nombre_contacto || '',
    })

    setMensaje(`Editando cliente: ${cliente.nombre_cliente}`)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function eliminarCliente(cliente: Cliente) {
    const confirmar = window.confirm(
      `¿Está seguro que desea eliminar el cliente "${cliente.nombre_cliente}"? Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    setCargando(true)
    setMensaje('')

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id_cliente', cliente.id_cliente)

      if (error) throw error

      if (idClienteEditando === cliente.id_cliente) {
        limpiarFormulario()
      }

      setMensaje('Cliente eliminado correctamente.')
      await cargarClientes()
    } catch (error: any) {
      console.error(error)
      setMensaje(
        `Error al eliminar cliente: ${obtenerMensajeError(error)}. Si el cliente ya tiene facturas o recibos asociados, no debe eliminarse; en ese caso conviene mantenerlo registrado.`
      )
    } finally {
      setCargando(false)
    }
  }

  function manejarAccionCliente(cliente: Cliente, accion: string) {
    if (accion === 'modificar') {
      cargarClienteParaModificar(cliente)
      return
    }

    if (accion === 'eliminar') {
      eliminarCliente(cliente)
    }
  }

  const clientesFiltrados = useMemo(() => {
    const busqueda = normalizarTexto(busquedaCliente)

    if (!busqueda) return clientes

    return clientes.filter((cliente) => {
      return (
        normalizarTexto(cliente.nombre_cliente).includes(busqueda) ||
        normalizarTexto(cliente.rtn).includes(busqueda) ||
        normalizarTexto(cliente.telefono).includes(busqueda) ||
        normalizarTexto(cliente.correo).includes(busqueda) ||
        normalizarTexto(cliente.nombre_contacto).includes(busqueda) ||
        normalizarTexto(cliente.direccion).includes(busqueda)
      )
    })
  }, [clientes, busquedaCliente])

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Registro de Clientes</h2>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-xl font-semibold text-gray-800">
            {idClienteEditando ? 'Modificar Cliente' : 'Nuevo Cliente'}
          </h3>

          {idClienteEditando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

          <div className="md:col-span-2 xl:col-span-3">
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
        </div>

        {mensaje && (
          <div className="mt-5 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-black">
            {mensaje}
          </div>
        )}

        <div className="mt-5 flex flex-col md:flex-row md:justify-end gap-3">
          {idClienteEditando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={guardarCliente}
            disabled={cargando}
            className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
          >
            {cargando
              ? idClienteEditando
                ? 'Actualizando...'
                : 'Guardando...'
              : idClienteEditando
                ? 'Actualizar cliente'
                : 'Guardar cliente'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 shadow-sm">
        <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-black">Buscar cliente</label>
            <input
              type="text"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              placeholder="Buscar por nombre, RTN, teléfono, correo, contacto o dirección"
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-black placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="text-sm text-gray-600">
              Mostrando {clientesFiltrados.length} de {clientes.length} cliente(s)
            </div>

            {busquedaCliente.trim() !== '' && (
              <button
                type="button"
                onClick={() => setBusquedaCliente('')}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left border border-gray-200 text-black">Nombre</th>
                <th className="p-3 text-left border border-gray-200 text-black">RTN</th>
                <th className="p-3 text-left border border-gray-200 text-black">Teléfono</th>
                <th className="p-3 text-left border border-gray-200 text-black">Correo</th>
                <th className="p-3 text-left border border-gray-200 text-black">Contacto</th>
                <th className="p-3 text-left border border-gray-200 text-black">Dirección</th>
                <th className="p-3 text-center border border-gray-200 text-black">Fecha</th>
                <th className="p-3 text-center border border-gray-200 text-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargandoClientes ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center border border-gray-200 text-gray-500 bg-white"
                  >
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center border border-gray-200 text-gray-500 bg-white"
                  >
                    No hay clientes para mostrar.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
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
                    <td className="p-3 border border-gray-200">
                      {cliente.direccion || '-'}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      {formatearFecha(cliente.fecha_registro)}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      <select
                        value=""
                        onChange={(e) => {
                          manejarAccionCliente(cliente, e.target.value)
                          e.target.value = ''
                        }}
                        className="rounded-lg bg-white border border-gray-300 px-2 py-1 text-black"
                      >
                        <option value="">Acción</option>
                        <option value="modificar">Modificar</option>
                        <option value="eliminar">Eliminar</option>
                      </select>
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
