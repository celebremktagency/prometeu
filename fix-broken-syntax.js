const fs = require('fs');
const path = require('path');

// Função para corrigir sintaxe quebrada
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = false;

  // Fix broken styled components
  content = content.replace(/background-\s*(color)?\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\{/g, 'background-color: ${({ backgroundColor, variant }) => {');
  content = content.replace(/background-[^;:]*;\s*variant\s*\}\)\s*=>\s*\{/g, 'background-color: ${({ backgroundColor, variant }) => {');
  content = content.replace(/color[^;:]*;\s*variant\s*\}\)\s*=>\s*\{/g, 'color: ${({ variant }) => {');
  
  // Fix broken CSS properties
  content = content.replace(/shadow-;/g, 'shadow-color: transparent;');
  content = content.replace(/background-;/g, 'background-color: transparent;');
  content = content.replace(/border-;/g, 'border-color: transparent;');
  
  // Fix broken styled component definitions
  content = content.replace(/const\s+(\w+)\s+=\s+styled\([^)]+\)<[^>]*>`[^`]*background-[^`]*`/g, (match) => {
    return match.replace(/background-[^`]*/, 'background-color: ${colors.surface};');
  });

  // Fix malformed template literals in styled components
  content = content.replace(/`([^`]*)\}\)\s*=>\s*(\w+)[^`]*`/g, (match, p1, p2) => {
    if (p1.includes('background-') || p1.includes('color')) {
      return '`' + p1 + '}};`';
    }
    return match;
  });

  // Fix broken function signatures
  content = content.replace(/\}\)\s*=>\s*\{[^}]*size\s*\?\s*typography/g, '}) => typography');
  content = content.replace(/\}\)\s*=>\s*\{[^}]*variant\s*\?\s*colors/g, '}) => colors');

  // Fix incomplete lines that end with just "})" or similar
  content = content.replace(/^\s*\}\)\s*=>\s*$/gm, '  }};');
  content = content.replace(/^\s*color\s*$/gm, '');
  content = content.replace(/^\s*backgroundColor\s*$/gm, '');

  // Fix broken object destructuring
  content = content.replace(/\{\s*iconColor,\s*backgroundColor,\s*children,/g, '{\n  title,\n  subtitle,\n  description,\n  icon,\n  iconColor,\n  backgroundColor,\n  children,');

  // Fix broken template literal endings
  content = content.replace(/`;\s*\}\s*=>\s*\{/g, '`;\n');
  
  // Fix broken JSX
  content = content.replace(/color=\{[^}]*\}\s*\/>/g, '/>');
  content = content.replace(/size=\{[^}]*\}\s*\/>/g, '/>');

  // Fix standalone blocks that got disconnected
  content = content.replace(/^\s*switch\s*\(\s*variant\s*\)\s*\{[\s\S]*?\s*\};\s*$/gm, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Função para corrigir arquivos específicos críticos
function fixCriticalFiles() {
  console.log('🔧 Fixing critical broken files...\n');

  const criticalFiles = [
    './app/src/components/Card.tsx',
    './app/src/components/HeaderMain.tsx',
    './app/src/components/SimpleProgressChart.tsx',
    './app/src/screens/WorkoutSelectionScreen.tsx',
    './app/src/navigation/index.tsx',
    './app/src/theme/lightTheme.ts',
    './app/src/design-system/legacy.ts',
    './app/src/design-system/components/Card.tsx',
    './app/src/design-system/components/Button.tsx'
  ];

  let totalFixed = 0;
  criticalFiles.forEach(filePath => {
    if (fixFile(filePath)) {
      totalFixed++;
    }
  });

  console.log(`\n📊 Fixed ${totalFixed}/${criticalFiles.length} critical files`);
  return totalFixed;
}

// Executar
fixCriticalFiles();