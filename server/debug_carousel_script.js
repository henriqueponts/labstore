// Arquivo: server/debug-carrossel.js
// Execute este script para debugar o carrossel: node debug-carrossel.js

import { connectToDatabase } from "./lib/db.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function debugcarrossel() {
  console.log("🔍 Iniciando debug do carrossel...")
  
  try {
    // 1. Conectar ao banco
    const db = await connectToDatabase()
    console.log("✅ Conectado ao banco de dados")
    
    // 2. Buscar todas as imagens do carrossel
    const [images] = await db.execute("SELECT * FROM carrossel_images ORDER BY ordem ASC")
    console.log(`📊 Encontradas ${images.length} imagens no banco`)
    
    // 3. Verificar estrutura de diretórios
    const uploadDir = path.join(__dirname, "uploads")
    const carrosselDir = path.join(__dirname, "uploads", "carrossel")
    
    console.log(`📁 Diretório uploads: ${uploadDir}`)
    console.log(`📁 Diretório carrossel: ${carrosselDir}`)
    console.log(`📁 Uploads existe: ${fs.existsSync(uploadDir)}`)
    console.log(`📁 carrossel existe: ${fs.existsSync(carrosselDir)}`)
    
    // Criar diretórios se não existirem
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log("📁 Criou diretório uploads")
    }
    
    if (!fs.existsSync(carrosselDir)) {
      fs.mkdirSync(carrosselDir, { recursive: true })
      console.log("📁 Criou diretório carrossel")
    }
    
    // 4. Listar arquivos no diretório carrossel
    const files = fs.existsSync(carrosselDir) ? fs.readdirSync(carrosselDir) : []
    console.log(`📋 Arquivos no diretório carrossel: ${files.length}`)
    files.forEach(file => console.log(`  - ${file}`))
    
    // 5. Verificar cada imagem do banco
    console.log("\n🔍 Verificando cada imagem:")
    for (const image of images) {
      console.log(`\n📸 Imagem ID ${image.id_carrossel}: ${image.titulo}`)
      console.log(`  - URL no banco: ${image.url_imagem}`)
      console.log(`  - Ativo: ${Boolean(image.ativo)}`)
      console.log(`  - Ordem: ${image.ordem}`)
      
      if (image.url_imagem) {
        // Verificar se o arquivo existe fisicamente
        let filePath
        if (image.url_imagem.startsWith('/uploads/')) {
          filePath = path.join(__dirname, image.url_imagem)
        } else if (image.url_imagem.startsWith('/')) {
          filePath = path.join(__dirname, image.url_imagem)
        } else {
          filePath = path.join(carrosselDir, image.url_imagem)
        }
        
        const fileExists = fs.existsSync(filePath)
        console.log(`  - Caminho físico: ${filePath}`)
        console.log(`  - Arquivo existe: ${fileExists}`)
        
        if (fileExists) {
          const stats = fs.statSync(filePath)
          console.log(`  - Tamanho: ${(stats.size / 1024).toFixed(2)} KB`)
        }
      } else {
        console.log(`  - ❌ Sem URL de imagem`)
      }
    }
    
    // 6. Sugestões de correção
    console.log("\n💡 Sugestões:")
    
    if (images.length === 0) {
      console.log("  - Execute o SQL para inserir dados padrão do carrossel")
    }
    
    const imagesWithoutFiles = images.filter(img => {
      if (!img.url_imagem) return true
      let filePath
      if (img.url_imagem.startsWith('/uploads/')) {
        filePath = path.join(__dirname, img.url_imagem)
      } else {
        filePath = path.join(carrosselDir, img.url_imagem)
      }
      return !fs.existsSync(filePath)
    })
    
    if (imagesWithoutFiles.length > 0) {
      console.log(`  - ${imagesWithoutFiles.length} imagem(ns) sem arquivo físico`)
      console.log("  - Faça upload de imagens via interface de admin")
    }
    
    const activeImages = images.filter(img => Boolean(img.ativo))
    console.log(`  - ${activeImages.length} imagem(ns) ativa(s) de ${images.length} total`)
    
    if (activeImages.length === 0) {
      console.log("  - Ative pelo menos uma imagem para exibir o carrossel")
    }
    
    console.log("\n✅ Debug concluído!")
    
  } catch (error) {
    console.error("❌ Erro durante debug:", error)
  } finally {
    process.exit(0)
  }
}

debugcarrossel()