// src/components/Analyzer/FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

interface FileUploadProps {
   onFileUpload: (data: string, filename: string) => void;
  isUploading?: boolean;
  disabled?: boolean;
  }

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isUploading = false,
  disabled = false
}) => {
  const [_dragActive, _setDragActive] = useState(false);

  const validateFile = (file: File) => {
    // Validar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Apenas arquivos CSV são permitidos');
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
    }

    return true;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
  if (disabled || isUploading) return
  const file = acceptedFiles[0]
  if (!file) return

  try {
    validateFile(file)

    const reader = new FileReader()
    reader.onload = e => {
      const csvData = e.target?.result as string
      onFileUpload(csvData, file.name)            // ✅ forma correta
    }
    reader.readAsText(file)                       // lê como texto
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Erro ao validar arquivo')
  }
}, [onFileUpload, disabled, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: disabled || isUploading
  });

  return (
    <div className="file-upload-section">
      <h2>📤 Upload do Relatório AdSense</h2>
      <div className="upload-instructions">
        <p><strong>Como exportar:</strong> Google AdSense → Relatórios → Selecionar período (mín. 7 dias) → Exportar → "Download em CSV"</p>
      </div>

      <div
        {...getRootProps()}
        className={`file-upload-zone ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''} ${isUploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="upload-loading">
            <div className="upload-spinner"></div>
            <h3>Processando arquivo...</h3>
            <p>Analisando dados do AdSense</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h3>
              {isDragActive 
                ? 'Solte o arquivo aqui' 
                : 'Arraste e solte seu arquivo CSV'
              }
            </h3>
            <p>ou <span className="upload-link">clique para selecionar</span></p>
            <div className="upload-requirements">
              <span>• Formato: CSV</span>
              <span>• Tamanho máximo: 10MB</span>
              <span>• Período mínimo: 7 dias</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;