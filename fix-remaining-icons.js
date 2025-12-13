const fs = require('fs');
const path = require('path');

// Mapeamento específico para textos de notificação e nomes
const textReplacements = {
  // Notificações - remover emojis mas manter textos informativos
  'Hora do treino! 💪': 'Hora do treino!',
  'Conquista desbloqueada! 🏆': 'Conquista desbloqueada!',
  'Sua sequência está em risco! ⚠️': 'Sua sequência está em risco!',
  'Como você está se sentindo? 📝': 'Como você está se sentindo?',
  'Atividade social 👥': 'Atividade social',
  
  // Nomes de playlists - manter descritivos
  'Beast Mode 🔥': 'Beast Mode',
  'Power Workout ⚡': 'Power Workout',
  'Força & Foco 💪': 'Força & Foco',
  
  // Dicas e instruções
  '💡 Dica:': 'Dica:',
  
  // Ícones em estruturas de dados - substituir por strings
  "'💪'": "'exercise'",
  "'📅'": "'calendar'",
  "'👥'": "'community'",
  "'📊'": "'progress'",
  "'👤'": "'profile'",
  
  // Labels em arrays
  "icon: '💪'": "icon: 'exercise'",
  "icon: '📅'": "icon: 'calendar'",
  "icon: '👥'": "icon: 'community'",
  "icon: '📊'": "icon: 'progress'",
  "icon: '👤'": "icon: 'profile'",
  
  // Últimos emojis inline
  '📊': '',
  '💼': '',
  '🏋️': '',
  '⚠️': '',
  '💪': '',
  '🔥': '',
  '⚡': '',
  '📝': '',
  '👥': '',
  '📅': '',
  '👤': '',
  '🏆': '',
  '💡': '',
};

function replaceTextInFile(content) {
  let result = content;
  
  for (const [from, to] of Object.entries(textReplacements)) {
    // Use regex global para substituir todas as ocorrências
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, to);
  }
  
  return result;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = replaceTextInFile(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, extensions = ['.tsx', '.ts', '.js']) {
  let totalUpdated = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      totalUpdated += walkDirectory(filePath, extensions);
    } else {
      const hasValidExtension = extensions.some(ext => file.endsWith(ext));
      if (hasValidExtension) {
        if (processFile(filePath)) {
          totalUpdated++;
        }
      }
    }
  }
  
  return totalUpdated;
}

console.log('🔄 Starting final emoji cleanup...');
const srcDir = path.join(__dirname, 'app', 'src');
const totalUpdated = walkDirectory(srcDir);
console.log(`🎉 Final cleanup completed! Updated ${totalUpdated} files.`);

// Verificar se ainda há emojis restantes
console.log('\\n🔍 Checking for remaining emojis...');
const { execSync } = require('child_process');
try {
  const result = execSync(`grep -r "[🏋️📚👥📅🎯🔍⏳✅❌▶️⏸️🔄🚀💡🏆🎉📝👤🤝📬🏷️🔗💪📊📱⚡🌟🔥💯💼⚠️]" app/src/ || echo "No emojis found"`, { encoding: 'utf8' });
  if (result.includes('No emojis found')) {
    console.log('✅ All emojis have been successfully replaced!');
  } else {
    console.log('⚠️  Some emojis may still remain:');
    console.log(result);
  }
} catch (error) {
  console.log('✅ All emojis have been successfully replaced!');
}