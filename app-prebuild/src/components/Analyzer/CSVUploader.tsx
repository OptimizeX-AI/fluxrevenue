// src/components/Analyzer/CSVUploader.tsx
import React, { useState, useRef } from 'react'
import { useFluxData } from '../../hooks/useFluxData'

interface CSVUploaderProps {
  onUpload: (data: any, siteId: string) => void
  loading: boolean
  error: string | null
}

interface Site {
  id: string
  url: string
  user_id: string
  created_at: string
}

interface CSVData {
  headers: string[]
  data: Record<string, string>[]
  summary: {
    totalPageviews: number
    totalEarnings: number
    totalDays: number
    dailyAvgPageviews: number
    dailyAvgEarnings: number
    avgRPM: number
  }
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onUpload, loading, error }) => {
  const { sites } = useFluxData()
  const [selectedSite, setSelectedSite] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!selectedSite) {
      alert('Selecione um site primeiro')
      return
    }

    if (file.type !== 'text/csv') {
      alert('Por favor, selecione um arquivo CSV')
      return
    }

    const text = await file.text()
    const csvData = parseCSV(text)
    onUpload(csvData, selectedSite)
  }

  const parseCSV = (text: string): CSVData => {
    // Implementação simplificada do parser CSV
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    const data = lines.slice(1).map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || ''
        return obj
      }, {} as Record<string, string>)
    })

    const filteredData = data.filter(row => Object.values(row).some(val => val))

    return {
      headers,
      data: filteredData,
      summary: calculateSummary(filteredData)
    }
  }

  const calculateSummary = (data: Record<string, string>[]) => {
    // Calcular métricas resumidas do CSV
    const totalPageviews = data.reduce((sum, row) => sum + (parseInt(row.pageviews) || 0), 0)
    const totalEarnings = data.reduce((sum, row) => sum + (parseFloat(row.earnings) || 0), 0)

    return {
      totalPageviews,
      totalEarnings,
      totalDays: data.length,
      dailyAvgPageviews: totalPageviews / data.length,
      dailyAvgEarnings: totalEarnings / data.length,
      avgRPM: totalPageviews > 0 ? (totalEarnings / totalPageviews) * 1000 : 0
    }
  }

  return (
    <div className="csv-uploader">
      {/* Site Selection */}
      <div className="site-selection">
        <label htmlFor="site-select">Selecione o site para análise:</label>
        <select
          id="site-select"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          disabled={loading}
        >
          <option value="">Escolha um site...</option>
          {sites?.map((site: Site) => (
            <option key={site.id} value={site.id}>
              {site.url}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${loading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {loading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Analisando dados do AdSense...</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📊</div>
            <h3>Faça upload do seu relatório CSV do AdSense</h3>
            <p>Arraste o arquivo aqui ou clique para selecionar</p>
            <small>Formato aceito: .csv (máximo 10MB)</small>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          ❌ {error}
        </div>
      )}

      {/* Instructions */}
      <div className="upload-instructions">
        <h4>Como exportar dados do AdSense:</h4>
        <ol>
          <li>Acesse sua conta do Google AdSense</li>
          <li>Vá para Relatórios → Performance por data</li>
          <li>Selecione o período desejado (mínimo 7 dias)</li>
          <li>Clique em "Exportar" → "CSV"</li>
          <li>Faça upload do arquivo aqui</li>
        </ol>
      </div>
    </div>
  )
}

export default CSVUploader
