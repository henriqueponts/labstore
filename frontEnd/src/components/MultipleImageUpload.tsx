"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Star, ArrowUp, ArrowDown } from "lucide-react"

interface ImageFile {
  file: File
  preview: string
  id: string
}

interface MultipleImageUploadProps {
  images: ImageFile[]
  onImagesChange: (images: ImageFile[]) => void
  maxImages?: number
  maxSizePerImage?: number // em MB
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 5,
}) => {
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)`
    }

    // Validar tamanho
    if (file.size > maxSizePerImage * 1024 * 1024) {
      return `${file.name}: Imagem deve ter no máximo ${maxSizePerImage}MB`
    }

    return null
  }

  const handleFiles = (files: FileList) => {
    const newErrors: string[] = []
    const newImages: ImageFile[] = []

    // Verificar limite total
    if (images.length + files.length > maxImages) {
      newErrors.push(`Máximo de ${maxImages} imagens permitidas`)
      setErrors(newErrors)
      return
    }

    Array.from(files).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
        return
      }

      const id = Date.now() + Math.random().toString(36)
      const preview = URL.createObjectURL(file)

      newImages.push({
        file,
        preview,
        id,
      })
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors([])
    onImagesChange([...images, ...newImages])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id)
    onImagesChange(updatedImages)

    // Limpar URL do preview para evitar memory leak
    const imageToRemove = images.find((img) => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
  }

  const moveImage = (id: string, direction: "up" | "down") => {
    const currentIndex = images.findIndex((img) => img.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= images.length) return

    const newImages = [...images]
    const [movedImage] = newImages.splice(currentIndex, 1)
    newImages.splice(newIndex, 0, movedImage)

    onImagesChange(newImages)
  }

  const setAsPrincipal = (id: string) => {
    const imageIndex = images.findIndex((img) => img.id === id)
    if (imageIndex === -1 || imageIndex === 0) return

    const newImages = [...images]
    const [principalImage] = newImages.splice(imageIndex, 1)
    newImages.unshift(principalImage)

    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        } ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => {
          if (images.length < maxImages) {
            fileInputRef.current?.click()
          }
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-500" />
        <p className="mb-2 text-sm text-gray-500">
          <span className="font-semibold">Clique para enviar</span> ou arraste e solte
        </p>
        <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (MAX. {maxSizePerImage}MB cada)</p>
        <p className="text-xs text-gray-400 mt-1">
          {images.length}/{maxImages} imagens
        </p>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={images.length >= maxImages}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Imagens do Produto</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Principal Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                    <Star size={12} className="mr-1" />
                    Principal
                  </div>
                )}

                {/* Controls */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Set as Principal */}
                  {index !== 0 && (
                    <button
                      onClick={() => setAsPrincipal(image.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded"
                      title="Definir como principal"
                    >
                      <Star size={12} />
                    </button>
                  )}

                  {/* Move Up */}
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(image.id, "up")}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="Mover para cima"
                    >
                      <ArrowUp size={12} />
                    </button>
                  )}

                  {/* Move Down */}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => moveImage(image.id, "down")}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={12} />
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                    title="Remover imagem"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Image Info */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  <p className="truncate">{image.file.name}</p>
                  <p>{(image.file.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Dicas:</p>
            <ul className="space-y-1 text-xs">
              <li>
                • A primeira imagem será a <strong>imagem principal</strong> do produto
              </li>
              <li>• Use o botão ⭐ para definir outra imagem como principal</li>
              <li>• Use as setas ↑↓ para reordenar as imagens</li>
              <li>• Máximo de {maxImages} imagens por produto</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultipleImageUpload
