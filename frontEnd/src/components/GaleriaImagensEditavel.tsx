"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Star, ArrowUp, ArrowDown, Plus } from "lucide-react"

interface ImagemExistente {
  id_imagem: number
  url_imagem: string
  nome_arquivo: string
  ordem: number
  is_principal: boolean
}

interface NovaImagemArquivo {
  arquivo: File
  visualizacao: string
  id: string
}

interface PropriedadesGaleriaImagensEditavel {
  imagensExistentes: ImagemExistente[]
  novasImagens: NovaImagemArquivo[]
  aoAlterarImagensExistentes: (imagens: ImagemExistente[]) => void
  aoAlterarNovasImagens: (imagens: NovaImagemArquivo[]) => void
  aoRemoverImagem: (idImagem: number) => void
  maximoImagens?: number
  tamanhoMaximoPorImagem?: number
}

const GaleriaImagensEditavel: React.FC<PropriedadesGaleriaImagensEditavel> = ({
  imagensExistentes,
  novasImagens,
  aoAlterarImagensExistentes,
  aoAlterarNovasImagens,
  aoRemoverImagem,
  maximoImagens = 10,
  tamanhoMaximoPorImagem = 5,
}) => {
  const [arrastando, setArrastando] = useState(false)
  const [erros, setErros] = useState<string[]>([])
  const referenciaInputArquivo = useRef<HTMLInputElement>(null)

  const totalImagens = imagensExistentes.length + novasImagens.length

  const validarArquivo = (arquivo: File): string | null => {
    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!tiposPermitidos.includes(arquivo.type)) {
      return `${arquivo.name}: Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)`
    }

    if (arquivo.size > tamanhoMaximoPorImagem * 1024 * 1024) {
      return `${arquivo.name}: Imagem deve ter no máximo ${tamanhoMaximoPorImagem}MB`
    }

    return null
  }

  const processarArquivos = (arquivos: FileList) => {
    const novosErros: string[] = []
    const novosArquivosImagem: NovaImagemArquivo[] = []

    if (totalImagens + arquivos.length > maximoImagens) {
      novosErros.push(`Máximo de ${maximoImagens} imagens permitidas`)
      setErros(novosErros)
      return
    }

    Array.from(arquivos).forEach((arquivo) => {
      const erro = validarArquivo(arquivo)
      if (erro) {
        novosErros.push(erro)
        return
      }

      const id = Date.now() + Math.random().toString(36)
      const visualizacao = URL.createObjectURL(arquivo)

      novosArquivosImagem.push({
        arquivo,
        visualizacao,
        id,
      })
    })

    if (novosErros.length > 0) {
      setErros(novosErros)
      return
    }

    setErros([])
    aoAlterarNovasImagens([...novasImagens, ...novosArquivosImagem])
  }

  const processarInputArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processarArquivos(e.target.files)
    }
  }

  const processarSoltar = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)

    if (e.dataTransfer.files) {
      processarArquivos(e.dataTransfer.files)
    }
  }

  const removerNovaImagem = (id: string) => {
    const imagensAtualizadas = novasImagens.filter((img) => img.id !== id)
    aoAlterarNovasImagens(imagensAtualizadas)

    const imagemParaRemover = novasImagens.find((img) => img.id === id)
    if (imagemParaRemover) {
      URL.revokeObjectURL(imagemParaRemover.visualizacao)
    }
  }

  const moverImagemExistente = (idImagem: number, direcao: "cima" | "baixo") => {
    const indiceAtual = imagensExistentes.findIndex((img) => img.id_imagem === idImagem)
    if (indiceAtual === -1) return

    const novoIndice = direcao === "cima" ? indiceAtual - 1 : indiceAtual + 1
    if (novoIndice < 0 || novoIndice >= imagensExistentes.length) return

    const novasImagens = [...imagensExistentes]
    const [imagemMovida] = novasImagens.splice(indiceAtual, 1)
    novasImagens.splice(novoIndice, 0, imagemMovida)

    // Atualizar ordens
    novasImagens.forEach((img, indice) => {
      img.ordem = indice
    })

    aoAlterarImagensExistentes(novasImagens)
  }

  const definirExistentePrincipal = (idImagem: number) => {
    const imagensAtualizadas = imagensExistentes.map((img) => ({
      ...img,
      is_principal: img.id_imagem === idImagem,
    }))

    aoAlterarImagensExistentes(imagensAtualizadas)
  }

  return (
    <div className="space-y-6">
      {/* Imagens Existentes */}
      {imagensExistentes.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Imagens Atuais</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagensExistentes.map((imagem, indice) => (
              <div key={imagem.id_imagem} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`http://localhost:3000/produtos${imagem.url_imagem}` || "/placeholder.svg"}
                    alt={`Imagem ${indice + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Badge Principal */}
                {imagem.is_principal && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                    <Star size={12} className="mr-1" />
                    Principal
                  </div>
                )}

                {/* Controles */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Definir como Principal */}
                  {!imagem.is_principal && (
                    <button
                      onClick={() => definirExistentePrincipal(imagem.id_imagem)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded"
                      title="Definir como principal"
                    >
                      <Star size={12} />
                    </button>
                  )}

                  {/* Mover para Cima */}
                  {indice > 0 && (
                    <button
                      onClick={() => moverImagemExistente(imagem.id_imagem, "cima")}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="Mover para cima"
                    >
                      <ArrowUp size={12} />
                    </button>
                  )}

                  {/* Mover para Baixo */}
                  {indice < imagensExistentes.length - 1 && (
                    <button
                      onClick={() => moverImagemExistente(imagem.id_imagem, "baixo")}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={12} />
                    </button>
                  )}

                  {/* Remover */}
                  <button
                    onClick={() => aoRemoverImagem(imagem.id_imagem)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                    title="Remover imagem"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Informações da Imagem */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  <p className="truncate">{imagem.nome_arquivo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Novas Imagens */}
      {novasImagens.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Novas Imagens</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {novasImagens.map((imagem, indice) => (
              <div key={imagem.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagem.visualizacao || "/placeholder.svg"}
                    alt={`Nova imagem ${indice + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Badge Nova */}
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Nova
                </div>

                {/* Botão Remover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removerNovaImagem(imagem.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                    title="Remover imagem"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Informações da Imagem */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  <p className="truncate">{imagem.arquivo.name}</p>
                  <p>{(imagem.arquivo.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Área de Upload */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 flex items-center">
          <Plus size={16} className="mr-2" />
          Adicionar Mais Imagens
        </h4>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            arrastando ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
          } ${totalImagens >= maximoImagens ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
          onDrop={processarSoltar}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastando(true)
          }}
          onDragLeave={() => setArrastando(false)}
          onClick={() => {
            if (totalImagens < maximoImagens) {
              referenciaInputArquivo.current?.click()
            }
          }}
        >
          <Upload className="w-8 h-8 mx-auto mb-4 text-gray-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Clique para enviar</span> ou arraste e solte
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (MÁX. {tamanhoMaximoPorImagem}MB cada)</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalImagens}/{maximoImagens} imagens
          </p>

          <input
            ref={referenciaInputArquivo}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={processarInputArquivo}
            disabled={totalImagens >= maximoImagens}
          />
        </div>

        {/* Erros */}
        {erros.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="text-sm text-red-600 space-y-1">
              {erros.map((erro, indice) => (
                <li key={indice}>• {erro}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">💡 Dicas para Edição:</p>
        <ul className="space-y-1 text-xs">
          <li>• Use o botão ⭐ para definir uma imagem como principal</li>
          <li>• Use as setas ↑↓ para reordenar as imagens existentes</li>
          <li>• Clique no ❌ para remover imagens (não pode ser desfeito)</li>
          <li>• Adicione novas imagens usando a área de upload</li>
          <li>• Máximo de {maximoImagens} imagens por produto</li>
        </ul>
      </div>
    </div>
  )
}

export default GaleriaImagensEditavel
