const fs = require('fs');
const path = require('path');

function fixBrokenFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let changes = 0;

  try {
    // Fix 1: Remove broken interface lines
    content = content.replace(/interface\s+\w+\s*\{\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)[^}]*\}/g, '');
    
    // Fix 2: Fix incomplete styled component definitions
    content = content.replace(/const\s+(\w+)\s*=\s*styled\([^)]+\)<[^>]*>`([^`]*)`(?!\s*;)/g, (match, name, styles) => {
      // If styles are empty or broken, provide basic styling
      if (!styles || styles.trim() === '' || styles.includes('background-;') || styles.includes('color;')) {
        return `const ${name} = styled(View)\`\`;`;
      }
      return match + ';';
    });

    // Fix 3: Fix broken template literals and malformed CSS
    content = content.replace(/background-[^;:}]*;/g, 'background-color: transparent;');
    content = content.replace(/color[^;:}]*;(?!\s*\/\/)/g, 'color: inherit;');
    content = content.replace(/border-[^;:}]*;/g, 'border-color: transparent;');
    content = content.replace(/shadow-[^;:}]*;/g, 'shadow-color: transparent;');

    // Fix 4: Remove incomplete prop definitions
    content = content.replace(/^\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)\s*[:=]?\s*[^;,}]*[;,]?\s*$/gm, '');

    // Fix 5: Fix malformed object properties
    content = content.replace(/\{\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)[^}]*\}/g, '{}');

    // Fix 6: Fix broken JSX elements
    content = content.replace(/<([A-Z]\w*)[^>]*\/>/g, '<$1 />');
    content = content.replace(/<([A-Z]\w*)[^>]*>([^<]*)<\/[^>]*>/g, '<$1>$2</$1>');

    // Fix 7: Remove standalone property assignments
    content = content.replace(/^\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)\s*=.*$/gm, '');

    // Fix 8: Fix malformed imports and exports
    content = content.replace(/export\s*\{\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)[^}]*\}/g, '');

    // Fix 9: Fix broken function parameters
    content = content.replace(/\(\s*\{[^}]*\s*(color|backgroundColor|fontFamily|fontSize|fontWeight)[^}]*\}\s*\)/g, '()');

    // Fix 10: Remove broken lines entirely
    const lines = content.split('\n');
    const fixedLines = lines.filter(line => {
      const trimmed = line.trim();
      // Remove lines that are just broken CSS properties
      if (/^(color|backgroundColor|fontFamily|fontSize|fontWeight)\s*[:=;]?\s*$/.test(trimmed)) return false;
      // Remove lines with just broken syntax
      if (/^[;,})\]]+$/.test(trimmed)) return false;
      // Remove lines with malformed styled component syntax
      if (/^\s*\}\)\s*=>\s*\{?\s*$/.test(trimmed)) return false;
      return true;
    });
    content = fixedLines.join('\n');

    // Fix 11: Ensure proper JSX structure
    content = content.replace(/>\s*$/, '>\n');
    content = content.replace(/^\s*</gm, '  <');

    // Fix 12: Fix incomplete template literals
    content = content.replace(/`[^`]*\$\{[^}]*\}[^`]*(?!`)/g, match => match + '`;');

    // Fix 13: Remove empty styled components
    content = content.replace(/const\s+\w+\s*=\s*styled\([^)]+\)`\s*`;/g, '');

    // Fix 14: Fix broken export statements
    content = content.replace(/export\s*\{[^}]*\}\s*from[^;]*;/g, '');

    // Fix 15: Clean up excessive newlines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      // Validate basic syntax before saving
      if (!content.includes('import') && originalContent.includes('import')) {
        // If we accidentally removed all imports, restore the file
        console.log(`⚠️  Skipping ${filePath} - would break imports`);
        return false;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      changes = originalContent.length - content.length;
      console.log(`✅ Fixed: ${filePath} (${changes} chars removed)`);
      return true;
    }

  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }

  return false;
}

function fixAllFiles(directory) {
  console.log(`🔧 Fixing all files in: ${directory}`);
  
  if (!fs.existsSync(directory)) {
    console.log(`❌ Directory not found: ${directory}`);
    return;
  }

  let totalFiles = 0;
  let fixedFiles = 0;

  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        totalFiles++;
        if (fixBrokenFile(filePath)) {
          fixedFiles++;
        }
      }
    });
  }

  processDirectory(directory);
  console.log(`\n📊 Fixed ${fixedFiles}/${totalFiles} files in ${directory}`);
  return fixedFiles;
}

// Execute fixing on all directories
console.log('🚀 Starting comprehensive file fixing...\n');

let totalFixed = 0;
totalFixed += fixAllFiles('./app/src/components');
totalFixed += fixAllFiles('./app/src/screens');
totalFixed += fixAllFiles('./app/src/services');
totalFixed += fixAllFiles('./app/src/theme');
totalFixed += fixAllFiles('./app/src/design-system');

console.log(`\n🎉 TOTAL: Fixed ${totalFixed} files`);
console.log('📝 Next: Run npm run type-check to see remaining errors');