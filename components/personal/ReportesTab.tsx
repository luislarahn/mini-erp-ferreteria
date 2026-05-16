'use client'

import { useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
import { supabase } from '../../lib/supabase'

type Puesto = {
  id_puesto: number
  nombre_puesto: string
  prefijo_puesto: string
  salario_base: number
  departamento: string
  created_at?: string | null
}

type Empleado = {
  id_empleado: number
  nombre_completo: string
  id_puesto?: number | null
  salario_base?: number
  puestos?: Array<{ nombre_puesto?: string; departamento?: string; salario_base?: number }>
}

type MemorandoImprimir = {
  id_empleado: number
  nombre_completo: string
  puesto: string
  departamento: string
  salario_base: number
  porcentaje: number
  nuevo_salario: number
}

export default function ReportesTab() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [filtroPuesto, setFiltroPuesto] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [empleadoIncrements, setEmpleadoIncrements] = useState<Record<number, string>>({})
  const [appliedSalaries, setAppliedSalaries] = useState<Record<number, number>>({})
  const [memorandosImprimir, setMemorandosImprimir] = useState<MemorandoImprimir[]>([])
  const [logoMemorando, setLogoMemorando] = useState('')
  const [ejecutarImpresionMemorando, setEjecutarImpresionMemorando] = useState(false)

  useEffect(() => {
    cargarPuestos()
    cargarEmpleados()
  }, [])

  useEffect(() => {
    if (memorandosImprimir.length > 0 && ejecutarImpresionMemorando) {
      window.print()
      setEjecutarImpresionMemorando(false)
      setTimeout(() => setMemorandosImprimir([]), 500)
    }
  }, [memorandosImprimir, ejecutarImpresionMemorando])

  async function cargarPuestos() {
    setCargando(true)
    const { data, error } = await supabase.from('puestos').select('*').order('id_puesto', { ascending: true })
    if (error) setMensaje(`Error al cargar puestos: ${error.message}`)
    else setPuestos(data || [])
    setCargando(false)
  }

  async function cargarEmpleados() {
    setCargando(true)
    const { data, error } = await supabase
      .from('empleados')
      .select(`id_empleado, nombre_completo, id_puesto, salario, puestos(nombre_puesto, departamento)`)
      .order('id_empleado', { ascending: true })

    if (error) {
      setMensaje(`Error al cargar empleados: ${error.message}`)
      setCargando(false)
      return
    }

    const empleadosData = (data || []).map((e: any) => ({
      ...e,
      salario_base: e.salario_base !== undefined ? e.salario_base : e.salario
    }))

    setEmpleados(empleadosData)
    setCargando(false)
  }

  const opcionesPuestos = useMemo(() => {
    const setN = new Set<string>()
    puestos.forEach((p) => setN.add(p.nombre_puesto))
    return Array.from(setN)
  }, [puestos])

  const opcionesDepartamentos = useMemo(() => {
    const setN = new Set<string>()
    puestos.forEach((p) => setN.add(p.departamento))
    return Array.from(setN)
  }, [puestos])

  function obtenerSalario(empleado: Empleado) {
    if (empleado.salario_base !== undefined && empleado.salario_base !== null) {
      return empleado.salario_base
    }
    const puesto = resolverPuesto(empleado)
    return puesto?.salario_base ?? 0
  }

  function resolverPuesto(empleado: Empleado) {
    if (Array.isArray(empleado.puestos) && empleado.puestos[0]) return empleado.puestos[0]
    return puestos.find((p) => p.id_puesto === empleado.id_puesto) || null
  }

  const empleadosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return empleados.filter((empleado) => {
      const puesto = resolverPuesto(empleado)
      const nombre = empleado.nombre_completo?.toLowerCase() ?? ''
      const nombrePuesto = puesto?.nombre_puesto?.toLowerCase() ?? ''
      const dept = puesto?.departamento?.toLowerCase() ?? ''

      if (filtroPuesto && puesto?.nombre_puesto?.toLowerCase() !== filtroPuesto.toLowerCase()) return false
      if (filtroDepartamento && puesto?.departamento?.toLowerCase() !== filtroDepartamento.toLowerCase()) return false

      if (!term) return true
      return nombre.includes(term) || nombrePuesto.includes(term) || dept.includes(term)
    })
  }, [empleados, searchTerm, filtroPuesto, filtroDepartamento])

  const totalEmpleados = empleadosFiltrados.length
  const salarioPromedio = totalEmpleados
    ? empleadosFiltrados.reduce((s, e) => s + obtenerSalario(e), 0) / totalEmpleados
    : 0
  const salarioMinimo = totalEmpleados
    ? Math.min(...empleadosFiltrados.map((e) => obtenerSalario(e)))
    : 0
  const salarioMaximo = totalEmpleados
    ? Math.max(...empleadosFiltrados.map((e) => obtenerSalario(e)))
    : 0

  const incrementoTotal = empleadosFiltrados.reduce((sum, e) => {
    const salario = obtenerSalario(e)
    const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
    if (Number.isNaN(pct)) return sum
    return sum + (salario * pct) / 100
  }, 0)

  async function convertirImagenBase64(url: string) {
    const response = await fetch(url)
    if (!response.ok) throw new Error('No se pudo cargar la imagen del logo.')
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('Error al convertir la imagen en Base64.'))
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  function printHtml(html: string) {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)

    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 500)
    }

    iframe.srcdoc = html
  }

  
  async function exportarExcel() {
    const rows = empleadosFiltrados.map((e) => {
      const puesto = resolverPuesto(e)
      const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
      const salarioBase = obtenerSalario(e)
      const incremento = Number.isNaN(pct) ? 0 : (salarioBase * pct) / 100
      return {
        ID: e.id_empleado,
        Nombre: e.nombre_completo,
        Puesto: puesto?.nombre_puesto ?? '-',
        Departamento: puesto?.departamento ?? '-',
        'Salario Base': salarioBase,
        'Incremento %': pct,
        'Nuevo Salario': salarioBase + incremento,
      }
    })

    if (rows.length === 0) return alert('No hay empleados para exportar.')

    try {
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Empleados')

      worksheet.columns = [
        { key: 'ID', width: 12 },
        { key: 'Nombre', width: 35 },
        { key: 'Puesto', width: 28 },
        { key: 'Departamento', width: 25 },
        { key: 'Salario Base', width: 18 },
        { key: 'Incremento %', width: 18 },
        { key: 'Nuevo Salario', width: 20 },
      ]

      const logoResponse = await fetch('/Ferreteríalogo.PNG')
      const logoBlob = await logoResponse.blob()
      const logoArrayBuffer = await logoBlob.arrayBuffer()
      const logoBuffer = new Uint8Array(logoArrayBuffer)
      const logoImageId = workbook.addImage({
        // @ts-expect-error - ExcelJS accepts Uint8Array in browser environments //NO BORRAR!!!!!!!!!!
        buffer: logoBuffer,
        extension: 'png',
      })

      //LOGO REVISAR
      worksheet.addImage(logoImageId, {
        tl: { col: 2, row: 0.2 },
        ext: { width: 120, height: 70 },
      })

      const empresaRow = worksheet.getRow(3)
      empresaRow.getCell(1).value = 'FERRETERÍA PROIS'
      empresaRow.getCell(1).font = { bold: true, size: 20, color: { argb: 'FF1F4E79' } }
      empresaRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
      
      worksheet.mergeCells('A3:G3')
      empresaRow.height = 30

      worksheet.getRow(4).height = 10

      const headers = ['ID', 'Nombre', 'Puesto', 'Departamento', 'Salario Base', 'Incremento %', 'Nuevo Salario']
      const headerRow = worksheet.getRow(5)
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F81BD' },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
      headerRow.height = 25

      rows.forEach((row, index) => {
        const dataRow = worksheet.getRow(6 + index)
        dataRow.values = [
          row.ID,
          row.Nombre,
          row.Puesto,
          row.Departamento,
          row['Salario Base'],
          row['Incremento %'],
          row['Nuevo Salario'],
        ]

        dataRow.eachCell((cell, colNum) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
          cell.alignment = {
            horizontal: colNum <= 2 ? 'left' : 'right',
            vertical: 'middle',
          }
          
          if (colNum === 5 || colNum === 7) {
            cell.numFmt = 'L #,##0.00'
          }
        })
        dataRow.height = 20
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fechaArchivo = new Date().toISOString().slice(0, 10)
      link.download = `empleados_${fechaArchivo}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error al exportar Excel:', error)
      alert('Error al exportar a Excel. Por favor, inténtalo de nuevo.')
    }
  }

  async function exportarPDFMemorado() {
    if (empleadosFiltrados.length === 0) {
      alert('No hay empleados seleccionados.')
      return
    }

    const logoDataUri = await convertirImagenBase64('/Ferreteríalogo.PNG')
    const memos = empleadosFiltrados.map((e) => {
      const puesto = resolverPuesto(e)
      const salarioBase = obtenerSalario(e)
      const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
      return {
        id_empleado: e.id_empleado,
        nombre_completo: e.nombre_completo,
        puesto: puesto?.nombre_puesto ?? '-',
        departamento: puesto?.departamento ?? '-',
        salario_base: salarioBase,
        porcentaje: Number.isNaN(pct) ? 0 : pct,
        nuevo_salario: salarioBase + (Number.isNaN(pct) ? 0 : (salarioBase * pct) / 100),
      }
    })

    setLogoMemorando(logoDataUri)
    setMemorandosImprimir(memos)
    setEjecutarImpresionMemorando(true)
  }

  async function imprimirEmpleados() {

    try {
      await exportarPDFMemorado()
    } catch (err) {
    }

    const rows = empleadosFiltrados.map((e) => {
      const puesto = resolverPuesto(e)
      const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
      const salarioBase = obtenerSalario(e)
      const incremento = Number.isNaN(pct) ? 0 : (salarioBase * pct) / 100
      const nuevoSalario = salarioBase + incremento
      return `<tr><td>${e.id_empleado}</td><td>${e.nombre_completo}</td><td>${puesto?.nombre_puesto ?? '-'}</td><td>${puesto?.departamento ?? '-'}</td><td>L ${salarioBase.toFixed(2)}</td><td>${pct}%</td><td>L ${nuevoSalario.toFixed(2)}</td></tr>`
    }).join('')

    const html = `
      <html>
        <head>
          <title>Reporte Empleados</title>
          <style>table{width:100%;border-collapse:collapse}td,th{border:1px solid #000;padding:8px;text-align:left}</style>
        </head>
        <body>
          <h2>Empleados filtrados</h2>
          <table><thead><tr><th>ID</th><th>Nombre</th><th>Puesto</th><th>Departamento</th><th>Salario Base</th><th>Incremento %</th><th>Nuevo salario</th></tr></thead><tbody>${rows}</tbody></table>
        </body>
      </html>
    `

    setTimeout(() => {
      printHtml(html)
    }, 800)
  }

  return (
    <div className="text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Reportes - Empleados</h2>
        <button
          onClick={() => {
            cargarPuestos()
            cargarEmpleados()
          }}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500"
        >
          Actualizar datos
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="text"
            placeholder="Buscar empleado"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black lg:w-2/3"
          />

          <select value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black lg:w-1/6">
            <option value="">Todos puestos</option>
            {opcionesPuestos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black lg:w-1/6">
            <option value="">Todos departamentos</option>
            {opcionesDepartamentos.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              const newApplied: Record<number, number> = {}
              empleadosFiltrados.forEach((e) => {
                const salarioBase = obtenerSalario(e)
                const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
                if (!Number.isNaN(pct) && pct !== 0) {
                  newApplied[e.id_empleado] = salarioBase + (salarioBase * pct) / 100
                }
              })
              setAppliedSalaries((prev) => ({ ...prev, ...newApplied }))
            }}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-white transition-colors hover:bg-emerald-500"
          >
            Aplicar incrementos
          </button>
          <button
            onClick={async () => {
              if (!confirm('¿Guardar los salarios aplicados en puestos? Esto modificará el salario base del puesto.')) return
              
              setCargando(true)
              try {
                const salariosPorEmpleado = empleadosFiltrados
                  .map((e) => {
                    const salarioBase = obtenerSalario(e)
                    const pct = Number(empleadoIncrements[e.id_empleado] ?? '0')
                    const nuevoSalario = appliedSalaries[e.id_empleado]
                    
                    if (e.id_puesto && nuevoSalario && !Number.isNaN(pct)) {
                      return {
                        id_empleado: Number(e.id_empleado),
                        id_puesto: Number(e.id_puesto),
                        porcentaje: Number(pct),
                        salario_anterior: Number(salarioBase),
                        salario_nuevo: Number(nuevoSalario)
                      }
                    }
                    return null
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null)

                if (salariosPorEmpleado.length === 0) {
                  setCargando(false)
                  setMensaje('No hay salarios aplicados para guardar.')
                  return
                }

                const datosParaInsertar = salariosPorEmpleado.map((s) => {
                  const empleado = empleados.find(e => e.id_empleado === s.id_empleado)
                  const puesto = empleado ? resolverPuesto(empleado) : null
                  return {
                    id_empleado: Number(s.id_empleado),
                    id_puesto: Number(s.id_puesto),
                    nombre_empleado: empleado?.nombre_completo || '',
                    nombre_puesto: puesto?.nombre_puesto || '',
                    porcentaje: s.porcentaje,
                    salario_anterior: s.salario_anterior,
                    salario_nuevo: s.salario_nuevo
                  }
                })

        
                const { data: insertData, error: errorInsert } = await supabase
                  .from('incrementos_salariales')
                  .insert(datosParaInsertar)
                  .select()

                if (errorInsert) {
                  alert(`Error al insertar en incrementos_salariales: ${errorInsert.message}`)
                  throw errorInsert
                }

                const actualizacionesEmpleados = salariosPorEmpleado.map((s) => ({
                  id_empleado: s.id_empleado,
                  salario_base: s.salario_nuevo
                }))

                if (actualizacionesEmpleados.length > 0) {

                  for (const emp of actualizacionesEmpleados) {
                    const { error: errorUpdateEmpleado } = await supabase
                      .from('empleados')
                      .update({ salario_base: emp.salario_base })
                      .eq('id_empleado', emp.id_empleado)

                    if (errorUpdateEmpleado) {
                      alert(`Error al actualizar empleado ${emp.id_empleado}: ${errorUpdateEmpleado.message}`)
                      throw errorUpdateEmpleado
                    }
                  }
                }

                await cargarPuestos()
                await cargarEmpleados()
                setAppliedSalaries({})
                setEmpleadoIncrements({})
                setMensaje('Incrementos guardados correctamente en la base de datos.')

              } catch (err: any) {
                console.error('Error al guardar incrementos:', err)
                alert(`Error detallado: ${err.message || JSON.stringify(err)}`)
                setMensaje(`Error al guardar: ${err.message || 'Verifica la conexión con la base de datos'}`)
              } finally {
                setCargando(false)
              }
            }}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-500"
          >
            Guardar incrementos
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total empleados</p>
          <p className="mt-2 text-2xl font-semibold text-black">{totalEmpleados}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Salario promedio</p>
          <p className="mt-2 text-2xl font-semibold text-black">L {salarioPromedio.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Salario mínimo</p>
          <p className="mt-2 text-2xl font-semibold text-black">L {salarioMinimo.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Salario máximo</p>
          <p className="mt-2 text-2xl font-semibold text-black">L {salarioMaximo.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Costo total de incremento</p>
          <p className="mt-2 text-2xl font-semibold text-black">L {incrementoTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <button onClick={exportarExcel} className="rounded-2xl bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-500">Exportar Excel</button>
        <button onClick={exportarPDFMemorado} className="rounded-2xl bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-500">Imprimir PDF</button>
      </div>

      <div id="reporte-pdf-print-section" style={{ display: 'none' }}>
        {memorandosImprimir.length > 0 && (
          <div> 
            {memorandosImprimir.map((memo) => (
  <div key={memo.id_empleado} style={{ pageBreakAfter: 'always', fontFamily: 'Arial, sans-serif', margin: 40 }}>
    
    {}
    <div style={{ 
      position: 'relative', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100px', 
      marginBottom: 40,
      width: '100%' 
    }}>
      
      {}
      <div style={{ position: 'absolute', left: 0, top: 0, textAlign: 'center' }}>
        <img 
          src={logoMemorando} 
          alt="Logo Ferretería Prois" 
          style={{ width: 100, height: 'auto', objectFit: 'contain' }} 
        />
      </div>

      {}
      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
        MEMORANDUM / {new Date().getFullYear()}
      </h3>
    </div>


                <table style={{ width: '100%', marginBottom: 30, fontSize: 12 }}>
                  <tbody>
                    <tr><td style={{ width: '15%', fontWeight: 'bold' }}>DE</td><td>: GERENCIA GENERAL</td></tr>
                    <tr><td style={{ fontWeight: 'bold' }}>PARA</td><td>: {memo.nombre_completo.toUpperCase()}</td></tr>
                    <tr><td style={{ fontWeight: 'bold' }}>ASUNTO</td><td>: INCREMENTO SALARIAL</td></tr>
                    <tr><td style={{ fontWeight: 'bold' }}>FECHA</td><td>: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
                  </tbody>
                </table>

                <hr style={{ border: '1px solid #000', margin: '20px 0' }} />

                <p style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'justify' }}>
                  Por medio del presente, informamos que ha sido aprobado un incremento salarial en su favor, el cual entrará en vigor a partir del presente mes.
                </p>

                <table style={{ width: '100%', margin: '20px 0', fontSize: 12, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, width: '40%', border: '1px solid #000' }}>Salario Actual</td>
                      <td style={{ padding: 10, width: '30%', border: '1px solid #000', textAlign: 'right' }}>L {memo.salario_base.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, border: '1px solid #000' }}>Porcentaje Incremento</td>
                      <td style={{ padding: 10, border: '1px solid #000', textAlign: 'right' }}>{memo.porcentaje}%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, border: '1px solid #000', fontWeight: 'bold' }}>Nuevo Salario</td>
                      <td style={{ padding: 10, border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>L {memo.nuevo_salario.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'justify' }}>
                  Este incremento salarial obedece a la compensación económica y a su compromiso con la empresa.
                </p>

                <div style={{ marginTop: 50, textAlign: 'center', fontSize: 11 }}>
                  <p style={{ margin: '150px 0 5px 0' }}>_____________________________</p>
                  <p>Gerencia General</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #reporte-pdf-print-section,
          #reporte-pdf-print-section * {
            visibility: visible;
          }

          #reporte-pdf-print-section {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            box-sizing: border-box;
            background: #fff;
          }
        }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Empleados (filtrados)</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-black">
              <th className="p-4 text-left border border-gray-200">ID</th>
              <th className="p-4 text-left border border-gray-200">Nombre</th>
              <th className="p-4 text-left border border-gray-200">Puesto</th>
              <th className="p-4 text-left border border-gray-200">Departamento</th>
              <th className="p-4 text-right border border-gray-200">Salario Base</th>
              <th className="p-4 text-right border border-gray-200">% Incremento</th>
              <th className="p-4 text-right border border-gray-200">Nuevo salario</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="p-6 text-center">Cargando...</td></tr>
            ) : empleadosFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center">No hay empleados que coincidan con el filtro.</td></tr>
            ) : (
              empleadosFiltrados.map((e) => {
                const puesto = resolverPuesto(e)
                const salarioBase = obtenerSalario(e)
                const pctStr = empleadoIncrements[e.id_empleado] ?? '0'
                const pct = Number(pctStr)
                const incremento = Number.isNaN(pct) ? 0 : (salarioBase * pct) / 100
                const nuevoSalario = salarioBase + incremento
                return (
                  <tr key={e.id_empleado} className="bg-white text-black">
                    <td className="p-4 border border-gray-200">{e.id_empleado}</td>
                    <td className="p-4 border border-gray-200">{e.nombre_completo}</td>
                    <td className="p-4 border border-gray-200">{puesto?.nombre_puesto ?? '-'}</td>
                    <td className="p-4 border border-gray-200">{puesto?.departamento ?? '-'}</td>
                    <td className="p-4 border border-gray-200 text-right">L {Number(salarioBase).toFixed(2)}</td>
                    <td className="p-4 border border-gray-200 text-right">
                      <input
                        type="number"
                        value={pctStr}
                        onChange={(ev) => setEmpleadoIncrements((prev) => ({ ...prev, [e.id_empleado]: ev.target.value }))}
                        className="w-24 rounded-xl border border-gray-300 px-2 py-1 text-black text-right"
                      />
                    </td>
                    <td className="p-4 border border-gray-200 text-right">L {nuevoSalario.toFixed(2)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}