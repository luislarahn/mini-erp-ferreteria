'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FacturacionTab from '../../components/clientes/FacturacionTab'
import ClientesTab from '../../components/clientes/ClientesTab'
import ReportesTab from '../../components/clientes/ReportesTab'
import ReporteProductos from '../../components/clientes/inventario/ReporteProductos'

type PestanaActiva = 'facturacion' | 'productos' | 'clientes' | 'reportes'

export default function ClientesPage() {
  const router = useRouter()
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('facturacion')

  const estiloBoton = (activa: boolean) =>
    `px-4 py-2 rounded-lg font-semibold transition ${
      activa
        ? 'bg-cyan-600 text-white shadow-md'
        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
    }`

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold"
        >
          ← Volver al dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mini ERP Ferretería</h1>
          <p className="text-slate-300 mt-2">Módulo Clientes</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className={estiloBoton(pestanaActiva === 'facturacion')}
            onClick={() => setPestanaActiva('facturacion')}
          >
            Facturación
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'productos')}
            onClick={() => setPestanaActiva('productos')}
          >
            Productos
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'clientes')}
            onClick={() => setPestanaActiva('clientes')}
          >
            Clientes
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'reportes')}
            onClick={() => setPestanaActiva('reportes')}
          >
            Reportes
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
          {pestanaActiva === 'facturacion' && <FacturacionTab />}
          {pestanaActiva === 'productos' && <ReporteProductos />}
          {pestanaActiva === 'clientes' && <ClientesTab />}
          {pestanaActiva === 'reportes' && <ReportesTab />}
        </div>
      </div>
    </div>
  )
}