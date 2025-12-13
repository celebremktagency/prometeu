const fs = require('fs');
const path = require('path');

// Última rodada de substituições
const finalReplacements = {
  // Interface icons
  "✏️": 'edit',
  "🗑️": 'remove', 
  "❤️": 'heart',
  "⚖️": 'balance',
  "⚙️": 'settings',
  "ℹ️": 'info',
  "✉️": 'message',
  "👁️": 'eye',
  "🤍": 'heart',
  "▶️": 'play',
  "⏸️": 'pause',
  "❌": 'close',
  "🤷‍♂️": 'help',
  "‍♂️": '',
  
  // Text patterns to clean up
  '<Text style={{ fontSize: 14 }}>edit</Text>': '<Icon name="edit" size={14} color={colors.text.primary} />',
  '<Text style={{ fontSize: 20 }}>edit</Text>': '<Icon name="edit" size={20} color={colors.accent.primary} />',
  '<Text style={{ fontSize: 14 }}>remove</Text>': '<Icon name="remove" size={14} color={colors.semantic.error} />',
  '<Text style={{ fontSize: 16 }}>message</Text>': '<Icon name="message" size={16} color={colors.text.primary} />',
  '<Text style={{ fontSize: 20 }}>info</Text>': '<Icon name="info" size={20} color={colors.accent.tertiary} />',
  '<Text style={{ fontSize: 48 }}>play</Text>': '<Icon name="play" size={48} color={colors.accent.primary} />',
  '<Text style={{ fontSize: 48, marginBottom: spacing.sm }}>help</Text>': '<Icon name="help" size={48} color={colors.text.secondary} style={{ marginBottom: spacing.sm }} />',
  '<Text style={{ fontSize: 64, marginBottom: spacing.md }}></Text>': '<Icon name="trainer" size={64} color={colors.accent.primary} style={{ marginBottom: spacing.md }} />',
  
  // Return statements
  "return 'heart';": "return <Icon name='heart' size={16} color={colors.semantic.error} />;",
  "return 'balance';": "return <Icon name='balance' size={16} color={colors.accent.primary} />;",  
  "return 'settings';": "return <Icon name='settings' size={16} color={colors.text.secondary} />;",
  
  // Icon mappings in arrays
  "icon: 'heart'": "icon: 'heart'",
  "icon: 'balance'": "icon: 'balance'", 
  "icon: 'settings'": "icon: 'settings'",
  
  // Button titles and labels
  "'{playing ? 'pause Pausar' : 'play Play'}'": "'{playing ? 'Pausar' : 'Play'}'",
  "'close Fechar'": "'Fechar'",
  "'edit Editar Programa'": "'Editar Programa'",
  
  // Text content in shares
  " Olá! Sou seu personal trainer": "Olá! Sou seu personal trainer",
  " Baixe o app": "Baixe o app",
  " Seus Treinos": "Seus Treinos",
  "heart ": "",
  "  ": " ", // Clean up double spaces
};

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [from, to] of Object.entries(finalReplacements)) {
      const before = content;
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      if (content !== before) changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error: ${filePath}:`, error.message);
    return false;
  }
}

function cleanAllFiles() {
  let total = 0;
  const srcDir = path.join(__dirname, 'app', 'src');
  
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (replaceInFile(fullPath)) total++;
      }
    }
  }
  
  walk(srcDir);
  console.log(`🎉 Final cleanup: ${total} files processed`);
}

console.log('🧹 Running final icon cleanup...');
cleanAllFiles();