const fs = require('fs');
const path = require('path');

// Mapeamento de emojis para ícones
const emojiToIcon = {
  '🚀': '<Icon name="target" size={16} color={colors.accent.primary} />',
  '📚': '<Icon name="library" size={16} color={colors.accent.secondary} />',
  '👥': '<Icon name="clients" size={16} color={colors.accent.primary} />',
  '📅': '<Icon name="calendar" size={16} color={colors.accent.primary} />',
  '🌟': '<Icon name="favorite" size={16} color={colors.accent.tertiary} />',
  '👤': '<Icon name="user" size={16} color={colors.text.primary} />',
  '📬': '<Icon name="invite" size={16} color={colors.accent.secondary} />',
  '🏷️': '<Icon name="code" size={16} color={colors.accent.primary} />',
  '📝': '<Icon name="edit" size={16} color={colors.text.secondary} />',
  '▶️': '<Icon name="play" size={16} color={colors.accent.primary} />',
  '❌': '<Icon name="close" size={16} color={colors.semantic.error} />',
  '🎯': '<Icon name="target" size={20} color={colors.accent.primary} />',
  '🏋️': '<Icon name="workout" size={20} color={colors.accent.secondary} />',
  '✅': '<Icon name="success" size={16} color={colors.accent.secondary} />',
  '⏳': '<Icon name="timer" size={16} color={colors.accent.primary} />',
  '🎉': '<Icon name="trophy" size={20} color={colors.accent.tertiary} />',
  '🏆': '<Icon name="trophy" size={20} color={colors.accent.tertiary} />',
  '🔍': '<Icon name="search" size={16} color={colors.text.primary} />',
  '🔗': '<Icon name="connect" size={16} color={colors.accent.primary} />',
  '🤝': '<Icon name="handshake" size={16} color={colors.accent.primary} />',
  '◀': '<Icon name="arrow-back" size={16} color={colors.text.primary} />',
  '💡': '<Icon name="info" size={20} color={colors.accent.tertiary} />',
};

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Substituir emojis nos títulos de botões
    for (const [emoji, iconComponent] of Object.entries(emojiToIcon)) {
      const regex = new RegExp(`title="[^"]*${emoji}[^"]*"`, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        for (const match of matches) {
          const newMatch = match.replace(emoji, '').trim();
          if (newMatch !== match) {
            content = content.replace(match, newMatch);
            modified = true;
            console.log(`Substituído emoji ${emoji} em título: ${filePath}`);
          }
        }
      }
    }
    
    // Substituir emojis em textos simples
    for (const [emoji, iconComponent] of Object.entries(emojiToIcon)) {
      const simpleTextRegex = new RegExp(`${emoji}\\s*([^<>]*?)`, 'g');
      if (content.includes(emoji)) {
        modified = true;
        console.log(`Emoji ${emoji} encontrado em: ${filePath} - Precisa de revisão manual`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Arquivo atualizado: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para processar todos os arquivos .tsx
function processAllFiles() {
  const srcDir = path.join(__dirname, 'app', 'src');
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') && !file.includes('node_modules')) {
        processFile(filePath);
      }
    }
  }
  
  walkDir(srcDir);
}

console.log('🔄 Iniciando substituição de emojis...');
processAllFiles();
console.log('✅ Substituição concluída!');