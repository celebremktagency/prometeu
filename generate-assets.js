const fs = require('fs');
const path = require('path');

// Função para criar um SVG de ícone simples
function createIconSVG(size, backgroundColor = '#06C7C3', textColor = '#FFFFFF') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.15}"/>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" text-anchor="middle" fill="${textColor}">P</text>
</svg>`;
}

// Função para criar splash screen SVG
function createSplashSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#FFFFFF"/>
  <circle cx="642" cy="1200" r="120" fill="#06C7C3"/>
  <text x="642" y="1240" font-family="Arial, sans-serif" font-size="96" font-weight="bold" text-anchor="middle" fill="#FFFFFF">P</text>
  <text x="642" y="1400" font-family="Arial, sans-serif" font-size="48" font-weight="600" text-anchor="middle" fill="#0F1724">Prometeus</text>
  <text x="642" y="1460" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#6B7280">Treinos Patológicos</text>
</svg>`;
}

// Criar diretório assets se não existir
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Gerar ícones
const iconSVG = createIconSVG(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSVG);

// Gerar ícone adaptativo (Android)
const adaptiveIconSVG = createIconSVG(1024, 'transparent', '#06C7C3');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIconSVG);

// Gerar splash screen
const splashSVG = createSplashSVG();
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSVG);

// Gerar favicon
const faviconSVG = createIconSVG(512);
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSVG);

console.log('✅ Assets SVG gerados com sucesso!');
console.log('📁 Arquivos criados em ./assets/');
console.log('');
console.log('Para converter para PNG (opcional):');
console.log('1. Use um conversor online SVG para PNG');
console.log('2. Ou instale imagemagick: brew install imagemagick');
console.log('3. Execute: convert assets/icon.svg assets/icon.png');
console.log('');
console.log('🚀 Agora você pode executar: eas build --platform all --profile preview');