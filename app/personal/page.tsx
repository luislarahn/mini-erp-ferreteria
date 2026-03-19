'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PersonalTab from '../../components/personal/PersonalTab'
import PuestosSalariosTab from '../../components/personal/PuestosSalariosTab'
import VacacionesTab from '../../components/personal/VacacionesTab'
import ReportesTab from '../../components/personal/ReportesTab'

type PestanaActiva = 'personal' | 'puestos' | 'vacaciones' | 'reportes'

export default function PersonalPage() {
  const router = useRouter()
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('personal')

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
          <p className="text-slate-300 mt-2">Módulo Personal</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className={estiloBoton(pestanaActiva === 'personal')}
            onClick={() => setPestanaActiva('personal')}
          >
            Personal
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'puestos')}
            onClick={() => setPestanaActiva('puestos')}
          >
            Puestos y Salarios
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'vacaciones')}
            onClick={() => setPestanaActiva('vacaciones')}
          >
            Vacaciones
          </button>

          <button
            className={estiloBoton(pestanaActiva === 'reportes')}
            onClick={() => setPestanaActiva('reportes')}
          >
            Reportes
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
          {pestanaActiva === 'personal' && <PersonalTab />}
          {pestanaActiva === 'puestos' && <PuestosSalariosTab />}
          {pestanaActiva === 'vacaciones' && <VacacionesTab />}
          {pestanaActiva === 'reportes' && <ReportesTab />}
        </div>
      </div>
    </div>
  )
}