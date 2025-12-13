const fs = require('fs');
const path = require('path');

// Propriedades que devem ser removidas COMPLETAMENTE
const textAndColorProperties = [
  'fontFamily',
  'fontSize', 
  'fontWeight',
  'color',
  'backgroundColor',
  'textColor',
  'background-color',
  'font-family',
  'font-size',
  'font-weight'
];

// Função para processar um arquivo
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // Remove propriedades CSS em styled components
  textAndColorProperties.forEach(prop => {
    // Remove linhas inteiras que contêm essas propriedades
    const regex1 = new RegExp(`^\\s*${prop}[^;]*;\\s*$`, 'gm');
    const regex2 = new RegExp(`\\s*${prop}\\s*:[^;,}]*[;,]?`, 'g');
    const regex3 = new RegExp(`\\s*${prop.replace('-', '-?')}\\s*:[^;,}]*[;,]?`, 'g');
    
    content = content.replace(regex1, '');
    content = content.replace(regex2, '');
    content = content.replace(regex3, '');
  });

  // Remove propriedades de objeto JavaScript/TypeScript
  textAndColorProperties.forEach(prop => {
    const jsRegex = new RegExp(`\\s*${prop}\\s*:\\s*[^,}]*,?`, 'g');
    content = content.replace(jsRegex, '');
  });

  // Remove linhas vazias excessivas
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.replace(/{\s*\n\s*}/g, '{}');

  if (content !== originalContent) {
    changes = originalContent.length - content.length;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath} - ${changes} caracteres removidos`);
    return true;
  }

  return false;
}

// Função para processar todos os arquivos em um diretório
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Diretório não encontrado: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  let totalProcessed = 0;
  let totalChanged = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursão para subdiretórios
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      totalProcessed++;
      if (processFile(filePath)) {
        totalChanged++;
      }
    }
  });

  if (totalProcessed > 0) {
    console.log(`📁 ${dirPath}: ${totalChanged}/${totalProcessed} arquivos alterados`);
  }
}

// Executar
console.log('🚀 Iniciando remoção de estilos de texto e cor...\n');

console.log('📂 Processando componentes...');
processDirectory('./app/src/components');

console.log('\n📂 Processando telas...');
processDirectory('./app/src/screens');

console.log('\n📂 Processando design system...');
processDirectory('./app/src/design-system');

console.log('\n📂 Processando outros arquivos...');
processDirectory('./app/src');

console.log('\n✅ Processamento concluído!');
console.log('📝 Execute npm run lint para verificar erros ESLint');
console.log('🔍 Execute npm run typecheck para verificar erros TypeScript');