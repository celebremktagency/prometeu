// Test script para verificar se as rotas estão funcionando
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando estrutura de navegação...\n');

// Verificar se todos os arquivos de telas existem
const screensToCheck = [
  'AuthScreen.tsx',
  'HomeScreen.tsx', 
  'ProfileScreen.tsx',
  'ProgressScreen.tsx',
  'ExerciseDetailScreen.tsx',
  'WorkoutTemplateDetailScreen.tsx',
  'CommunityScreen.tsx',
  'CalendarScreen.tsx',
  'ProfessionalDashboardScreen.tsx',
  'ClientListScreen.tsx',
  'ClientDetailsScreen.tsx',
  'WorkoutLibraryScreen.tsx',
  'CreateWorkoutScreen.tsx',
  'WorkoutExecutionScreen.tsx',
  'WorkoutDetailScreen.tsx'
];

let allScreensExist = true;

screensToCheck.forEach(screen => {
  const screenPath = path.join(__dirname, 'app/src/screens', screen);
  if (fs.existsSync(screenPath)) {
    console.log(`✅ ${screen} - existe`);
  } else {
    console.log(`❌ ${screen} - NÃO EXISTE`);
    allScreensExist = false;
  }
});

console.log('\n🔍 Verificando design-system...');

// Verificar componentes do design-system
const designSystemComponents = [
  'components/Button.tsx',
  'components/Input.tsx', 
  'components/Avatar.tsx',
  'components/StreakCard.tsx',
  'components/MetricCard.tsx',
  'components/WeeklyCalendar.tsx',
  'components/NextWorkoutCard.tsx',
  'tokens/colors.ts',
  'tokens/typography.ts',
  'tokens/spacing.ts',
  'tokens/shadows.ts'
];

let allComponentsExist = true;

designSystemComponents.forEach(component => {
  const componentPath = path.join(__dirname, 'app/src/design-system', component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ design-system/${component} - existe`);
  } else {
    console.log(`❌ design-system/${component} - NÃO EXISTE`);
    allComponentsExist = false;
  }
});

console.log('\n📱 Verificando serviços...');

// Verificar serviços
const servicesToCheck = [
  'authService.ts',
  'supabaseClient.ts',
  'dorService.ts', 
  'treinoService.ts',
  'insightsService.ts'
];

let allServicesExist = true;

servicesToCheck.forEach(service => {
  const servicePath = path.join(__dirname, 'app/src/services', service);
  if (fs.existsSync(servicePath)) {
    console.log(`✅ services/${service} - existe`);
  } else {
    console.log(`❌ services/${service} - NÃO EXISTE`);
    allServicesExist = false;
  }
});

console.log('\n📋 RESULTADO FINAL:');
console.log(`Telas: ${allScreensExist ? '✅ Todas OK' : '❌ Faltando arquivos'}`);
console.log(`Design System: ${allComponentsExist ? '✅ Todos OK' : '❌ Faltando arquivos'}`);
console.log(`Serviços: ${allServicesExist ? '✅ Todos OK' : '❌ Faltando arquivos'}`);

if (allScreensExist && allComponentsExist && allServicesExist) {
  console.log('\n🎉 Estrutura de navegação está completa!');
} else {
  console.log('\n⚠️  Existem arquivos faltando que podem causar erros na navegação.');
}