import { forwardRef, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Paperclip, X } from 'lucide-react'

interface FilePickerProps {
  accept?: string
  file: File | null
  onFileChange: (file: File | null) => void
  /** Texto do estado vazio — ex.: "Selecionar CSV do extrato". */
  placeholder?: string
  disabled?: boolean
  'aria-label'?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Área de upload estilizada. Substitui o `<input type="file">` nativo, cuja parte
 * clicável tinha ~120 × 27 px e destoava do resto do design.
 */
export const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(function FilePicker(
  { accept, file, onFileChange, placeholder = 'Selecionar arquivo', disabled, ...rest },
  ref,
) {
  const localRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function setRefs(node: HTMLInputElement | null) {
    localRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onFileChange(e.target.files?.[0] ?? null)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFileChange(dropped)
  }

  function clear() {
    onFileChange(null)
    if (localRef.current) localRef.current.value = ''
  }

  return (
    <div
      className={`file-picker${dragging ? ' dragging' : ''}${disabled ? ' disabled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={setRefs}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="file-picker-input"
        {...rest}
      />

      {file ? (
        <>
          <Paperclip size={16} className="file-picker-ico" aria-hidden="true" />
          <span className="file-picker-name truncate">{file.name}</span>
          <span className="file-picker-size">{formatSize(file.size)}</span>
          <button
            type="button"
            className="file-picker-clear"
            onClick={clear}
            disabled={disabled}
            aria-label="Remover arquivo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <Paperclip size={16} className="file-picker-ico" aria-hidden="true" />
          <span className="file-picker-name">{placeholder}</span>
        </>
      )}
    </div>
  )
})
