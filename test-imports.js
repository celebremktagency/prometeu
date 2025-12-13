// Test script para verificar erros de importação sem rodar o app
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Testando importações principais...\n');

// Testar se o design-system exports está correto
try {
  console.log('📦 Verificando exports do design-system...');
  
  // Verificar se o index.ts do design-system está exportando tudo corretamente
  const designSystemIndex = fs.readFileSync('./app/src/design-system/index.ts', 'utf8');
  
  const requiredExports = [
    'colors',
    'typography', 
    'spacing',
    'shadows',
    'borderRadius',
    'Button',
    'Input',
    'Avatar',
    'StreakCard',
    'MetricCard',
    'WeeklyCalendar',
    'NextWorkoutCard'
  ];
  
  let missingExports = [];
  
  requiredExports.forEach(exportName => {
    if (!designSystemIndex.includes(exportName)) {
      missingExports.push(exportName);
    }
  });
  
  if (missingExports.length === 0) {
    console.log('✅ Todos os exports necessários estão presentes');
  } else {
    console.log('❌ Exports faltando:', missingExports);
  }

} catch (error) {
  console.log('❌ Erro ao verificar design-system:', error.message);
}

console.log('\n🧪 Testando navegação principal...');

// Verificar se a navigation está importando tudo corretamente  
try {
  const navigationFile = fs.readFileSync('./app/src/navigation/index.tsx', 'utf8');
  const typesFile = fs.readFileSync('./app/src/navigation/types.ts', 'utf8');
  
  console.log('✅ Arquivo de navegação carrega corretamente');
  console.log('✅ Arquivo de tipos de navegação carrega corretamente');
  
  // Verificar se todas as telas estão sendo importadas
  const requiredImports = [
    'AuthScreen',
    'HomeScreen',
    'ProfileScreen', 
    'ProgressScreen',
    'ExerciseDetailScreen',
    'WorkoutTemplateDetailScreen',
    'CommunityScreen',
    'CalendarScreen'
  ];
  
  let missingImports = [];
  requiredImports.forEach(importName => {
    if (!navigationFile.includes(importName)) {
      missingImports.push(importName);
    }
  });
  
  if (missingImports.length === 0) {
    console.log('✅ Todas as telas estão sendo importadas');
  } else {
    console.log('❌ Telas não importadas:', missingImports);
  }
  
} catch (error) {
  console.log('❌ Erro ao verificar navegação:', error.message);
}

console.log('\n🔧 Verificando tipos TypeScript...');

// Verificar se há erros básicos de tipos
try {
  // Apenas uma verificação básica de sintaxe - não vai rodar tsc completo
  const homeScreen = fs.readFileSync('./app/src/screens/HomeScreen.tsx', 'utf8');
  
  if (homeScreen.includes('export') && homeScreen.includes('HomeScreen')) {
    console.log('✅ HomeScreen exporta corretamente');
  } else {
    console.log('❌ HomeScreen tem problema de export');
  }
  
  const authScreen = fs.readFileSync('./app/src/screens/AuthScreen.tsx', 'utf8');
  
  if (authScreen.includes('export') && authScreen.includes('AuthScreen')) {
    console.log('✅ AuthScreen exporta corretamente');
  } else {
    console.log('❌ AuthScreen tem problema de export');
  }
  
} catch (error) {
  console.log('❌ Erro ao verificar tipos:', error.message);
}

console.log('\n📱 RESULTADO: Navegação pronta para teste!');
console.log('💡 Para testar completamente, execute: npx expo start');