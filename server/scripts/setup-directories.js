import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Criar estrutura de diretórios necessária
const directories = ["../uploads", "../uploads/carousel", "../uploads/produtos"]

console.log("🗂️ Criando estrutura de diretórios...")

directories.forEach((dir) => {
  const fullPath = path.join(__dirname, dir)

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    console.log(`✅ Diretório criado: ${fullPath}`)
  } else {
    console.log(`📁 Diretório já existe: ${fullPath}`)
  }
})

// Criar imagens padrão do carrossel (placeholders)
const carouselDefaults = [
  {
    filename: "default1.jpg",
    content: "Imagem padrão 1 do carrossel",
  },
  {
    filename: "default2.jpg",
    content: "Imagem padrão 2 do carrossel",
  },
  {
    filename: "default3.jpg",
    content: "Imagem padrão 3 do carrossel",
  },
]

console.log("\n🖼️ Verificando imagens padrão do carrossel...")

carouselDefaults.forEach((img) => {
  const imagePath = path.join(__dirname, "../uploads/carousel", img.filename)

  if (!fs.existsSync(imagePath)) {
    // Criar um arquivo placeholder simples
    fs.writeFileSync(imagePath, `# ${img.content}\nEste é um arquivo placeholder. Substitua por uma imagem real.`)
    console.log(`📝 Placeholder criado: ${img.filename}`)
  } else {
    console.log(`🖼️ Imagem já existe: ${img.filename}`)
  }
})

console.log("\n✅ Setup de diretórios concluído!")
console.log("\n📋 Próximos passos:")
console.log("1. Execute este script: node scripts/setup-directories.js")
console.log("2. Substitua os placeholders por imagens reais na pasta uploads/carousel/")
console.log("3. Verifique se o servidor está servindo arquivos estáticos corretamente")
console.log("4. Teste o carrossel na página inicial")
