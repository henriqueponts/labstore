// Script para atualizar termos pendentes para ativos automaticamente
import { connectToDatabase } from "../lib/db.js"

export default async function updatePendingTerms() {
  console.log("🔄 Iniciando verificação de termos pendentes...")

  try {
    const db = await connectToDatabase()

    // Buscar termos pendentes cuja data efetiva já chegou
    const [termosPendentes] = await db.query(`
      SELECT id_termo, versao, data_efetiva, status_termo
      FROM TermoConsentimento 
      WHERE status_termo = 'pendente' 
      AND DATE(data_efetiva) <= CURDATE()
    `)

    if (termosPendentes.length === 0) {
      console.log("✅ Nenhum termo pendente para ativar")
      return { updated: 0, terms: [] }
    }

    console.log(`📋 Encontrados ${termosPendentes.length} termo(s) para ativar:`)

    const updatedTerms = []

    for (const termo of termosPendentes) {
      console.log(`🔄 Ativando termo ID ${termo.id_termo} (v${termo.versao}) - Data: ${termo.data_efetiva}`)

      // Atualizar status para ativo
      await db.query(
        `UPDATE TermoConsentimento 
         SET status_termo = 'ativo' 
         WHERE id_termo = ?`,
        [termo.id_termo],
      )

      updatedTerms.push({
        id_termo: termo.id_termo,
        versao: termo.versao,
        data_efetiva: termo.data_efetiva,
      })

      console.log(`✅ Termo ID ${termo.id_termo} ativado com sucesso`)
    }

    console.log(`🎉 Processo concluído! ${updatedTerms.length} termo(s) ativado(s)`)

    return {
      updated: updatedTerms.length,
      terms: updatedTerms,
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar termos pendentes:", error)
    throw error
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePendingTerms()
    .then((result) => {
      console.log("📊 Resultado:", result)
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Erro:", error)
      process.exit(1)
    })
}
