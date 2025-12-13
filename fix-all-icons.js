const fs = require('fs');
const path = require('path');

// Mapeamento de emojis para componentes Icon
const emojiReplacements = {
  // Fitness e treino
  '🏋️': '<Icon name="workout" size={16} color={colors.accent.primary} />',
  '💪': '<Icon name="strength" size={16} color={colors.accent.primary} />',
  '🏃‍♂️': '<Icon name="exercise" size={16} color={colors.accent.primary} />',
  '🏃‍♀️': '<Icon name="exercise" size={16} color={colors.accent.primary} />',
  
  // Navegação e tempo
  '📅': '<Icon name="calendar" size={16} color={colors.accent.primary} />',
  '⏱️': '<Icon name="timer" size={16} color={colors.accent.primary} />',
  '⏳': '<Icon name="timer" size={16} color={colors.accent.primary} />',
  
  // Status e feedback
  '✅': '<Icon name="check" size={16} color={colors.accent.secondary} />',
  '❌': '<Icon name="close" size={16} color={colors.semantic.error} />',
  '⭐': '<Icon name="favorite" size={16} color={colors.accent.tertiary} />',
  '🌟': '<Icon name="favorite" size={16} color={colors.accent.tertiary} />',
  
  // Progresso e métricas
  '📊': '<Icon name="chart" size={16} color={colors.accent.primary} />',
  '🎯': '<Icon name="target" size={16} color={colors.accent.primary} />',
  '🔥': '<Icon name="fire" size={16} color={colors.semantic.error} />',
  '🏆': '<Icon name="trophy" size={16} color={colors.accent.tertiary} />',
  '🎉': '<Icon name="trophy" size={16} color={colors.accent.tertiary} />',
  
  // Pessoas e social
  '👤': '<Icon name="user" size={16} color={colors.text.primary} />',
  '👥': '<Icon name="clients" size={16} color={colors.accent.primary} />',
  '👨‍⚕️': '<Icon name="trainer" size={16} color={colors.accent.primary} />',
  '👨‍💼': '<Icon name="trainer" size={16} color={colors.accent.primary} />',
  '🤝': '<Icon name="handshake" size={16} color={colors.accent.primary} />',
  
  // Comunicação e interface
  '💬': '<Icon name="message" size={16} color={colors.accent.primary} />',
  '📬': '<Icon name="notification" size={16} color={colors.accent.secondary} />',
  '🔍': '<Icon name="search" size={16} color={colors.text.primary} />',
  '📝': '<Icon name="edit" size={16} color={colors.text.secondary} />',
  
  // Dados e informações
  '📚': '<Icon name="library" size={16} color={colors.accent.secondary} />',
  '📋': '<Icon name="template" size={16} color={colors.text.primary} />',
  '📄': '<Icon name="template" size={16} color={colors.text.primary} />',
  '💡': '<Icon name="info" size={16} color={colors.accent.tertiary} />',
  '🏷️': '<Icon name="code" size={16} color={colors.accent.primary} />',
  
  // Ações e controles
  '▶️': '<Icon name="play" size={16} color={colors.accent.primary} />',
  '⏸️': '<Icon name="pause" size={16} color={colors.accent.primary} />',
  '🚀': '<Icon name="target" size={16} color={colors.accent.primary} />',
  '🔄': '<Icon name="refresh" size={16} color={colors.accent.primary} />',
  '🔗': '<Icon name="connect" size={16} color={colors.accent.primary} />',
  '◀': '<Icon name="arrow-back" size={16} color={colors.text.primary} />',
  '↗️': '<Icon name="trending-up" size={16} color={colors.accent.secondary} />',
  
  // Emoções e estados
  '😊': '<Icon name="favorite" size={16} color={colors.accent.secondary} />',
  '😔': '<Icon name="pain" size={16} color={colors.semantic.warning} />',
  
  // Símbolos especiais  
  '🔢': '',
  '💯': '',
  '⚡': '',
  '📱': '',
};

function replaceEmojisInText(text) {
  let result = text;
  
  // Primeiro, substituir emojis em títulos de botões (title="...")
  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    // Substituir em títulos mantendo apenas o texto
    const titleRegex = new RegExp(`(title=["'])[^"']*${emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^"']*["'])`, 'g');
    result = result.replace(titleRegex, (match, prefix, suffix) => {
      return prefix + match.replace(prefix, '').replace(suffix, '').replace(emoji, '').trim() + suffix;
    });
    
    // Substituir emojis standalone em Text components
    const standAloneRegex = new RegExp(`<Text[^>]*>${emoji}</Text>`, 'g');
    result = result.replace(standAloneRegex, replacement);
    
    // Substituir emojis em meio a texto
    const inlineRegex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(inlineRegex, '');
  }
  
  return result;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = replaceEmojisInText(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processAllFiles() {
  const srcDir = path.join(__dirname, 'app', 'src', 'screens');
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    let totalUpdated = 0;
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        totalUpdated += walkDir(filePath);
      } else if (file.endsWith('.tsx')) {
        if (processFile(filePath)) {
          totalUpdated++;
        }
      }
    }
    
    return totalUpdated;
  }
  
  console.log('🔄 Starting emoji replacement in screens...');
  const updated = walkDir(srcDir);
  console.log(`🎉 Completed! Updated ${updated} files.`);
}

processAllFiles();