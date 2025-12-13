#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de correções TypeScript automáticas
const fixes = [
  // Corrigir imports do Supabase
  {
    file: 'app/src/services/supabaseClient.ts',
    find: /Parameter 'url' implicitly has an 'any' type/,
    replace: (content) => content.replace(/const customFetch = async \(url, options = \{\}\) => \{/, 'const customFetch = async (url: string, options: any = {}) => {')
  },
  
  // Corrigir authServiceMock
  {
    file: 'app/src/services/authServiceMock.ts',
    find: /let currentMockUser = null;/,
    replace: (content) => content.replace(/let currentMockUser = null;/, 'let currentMockUser: any = null;')
  },
  {
    file: 'app/src/services/authServiceMock.ts',
    find: /let currentMockProfile = null;/,
    replace: (content) => content.replace(/let currentMockProfile = null;/, 'let currentMockProfile: any = null;')
  },
  
  // Corrigir services com parâmetros any
  {
    file: 'app/src/services/communityService.ts',
    find: /Parameter '.*' implicitly has an 'any' type/,
    replace: (content) => {
      return content
        .replace(/post\) => \{/, 'post: any) => {')
        .replace(/comment\) => \{/, 'comment: any) => {')
        .replace(/reply\) => \{/, 'reply: any) => {');
    }
  }
];

console.log('🔧 Aplicando correções TypeScript...');

// Aplicar cada correção
fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const newContent = fix.replace(content);
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Corrigido: ${fix.file}`);
      }
    } catch (err) {
      console.log(`❌ Erro em ${fix.file}:`, err.message);
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${fix.file}`);
  }
});

console.log('✅ Correções TypeScript concluídas!');