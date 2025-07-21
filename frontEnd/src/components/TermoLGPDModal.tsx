"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, FileText, Check } from "lucide-react"

interface TermoData {
  id_termo: number
  conteudo: string
  versao: string
  data_efetiva: string
}

interface TermoLGPDModalProps {
  isOpen: boolean
  termo: TermoData | null
  onAccept: (termoId: number) => Promise<void>
  onClose?: () => void
  canClose?: boolean
  title?: string
}

const TermoLGPDModal: React.FC<TermoLGPDModalProps> = ({
  isOpen,
  termo,
  onAccept,
  onClose,
  canClose = false,
  title = "Termo de Consentimento LGPD",
}) => {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAccepted(false)
      setScrolledToBottom(false)
    }
  }, [isOpen])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    setScrolledToBottom(isAtBottom)
  }

  const handleAccept = async () => {
    if (!termo || !accepted) return

    setLoading(true)
    try {
      await onAccept(termo.id_termo)
    } catch (error) {
      console.error("Erro ao aceitar termo:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !termo) return null

  // Verificação de segurança
  if (!termo || !termo.conteudo) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando termo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FileText className="text-blue-600 mr-3" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-600">Versão {termo.versao}</p>
            </div>
          </div>
          {canClose && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto border-b" onScroll={handleScroll}>
            <div className="prose max-w-none">
              <div
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: (termo.conteudo || "").replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </div>

          {/* Scroll indicator */}
          {!scrolledToBottom && (
            <div className="px-6 py-2 bg-yellow-50 border-b">
              <p className="text-sm text-yellow-700 text-center">⬇️ Role até o final para habilitar o botão de aceite</p>
            </div>
          )}

          {/* Acceptance checkbox */}
          <div className="p-6 bg-gray-50">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={!scrolledToBottom}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <div className="flex-1">
                <span className={`text-sm font-medium ${scrolledToBottom ? "text-gray-900" : "text-gray-400"}`}>
                  Li e aceito os termos de consentimento LGPD
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Ao aceitar, você concorda com o tratamento de seus dados pessoais conforme descrito acima.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          {canClose && onClose && (
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              Cancelar
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className={`px-6 py-2 rounded-md font-medium transition-all flex items-center ${
              accepted && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Aceitar Termos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermoLGPDModal
