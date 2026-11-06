'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn, validateImageFile, formatFileSize } from '@/lib/utils'

interface ImageUploadProps {
  value: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function ImageUpload({ value, onChange, maxFiles = 3, disabled = false }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors]     = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const errs: string[] = []
    const valid: File[] = []

    Array.from(newFiles).forEach(file => {
      const err = validateImageFile(file)
      if (err) errs.push(`${file.name}: ${err}`)
      else if (value.length + valid.length < maxFiles) valid.push(file)
      else errs.push(`Max ${maxFiles} images allowed.`)
    })

    setErrors(errs)
    if (valid.length > 0) onChange([...value, ...valid])
  }

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150',
          dragOver    ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-400 hover:bg-surface-muted',
          disabled    && 'opacity-50 cursor-not-allowed pointer-events-none',
          value.length >= maxFiles && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
      >
        <Upload className="w-8 h-8 text-content-subtle mx-auto mb-2" />
        <p className="text-sm font-medium text-content">Drop images here or click to browse</p>
        <p className="text-xs text-content-muted mt-1">JPEG, PNG, WebP up to 5 MB · Max {maxFiles} images</p>
        {value.length > 0 && (
          <p className="text-xs text-primary-700 mt-1 font-medium">{value.length} / {maxFiles} selected</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={e => addFiles(e.target.files)}
        disabled={disabled || value.length >= maxFiles}
      />

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((file, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border bg-surface-subtle aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(i) }}
                  className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                <p className="text-white text-[10px] truncate">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-700">{e}</p>
          ))}
        </div>
      )}
    </div>
  )
}

