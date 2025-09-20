#!/bin/bash

echo "🚀 INICIANDO BUILD DO PROMETEUS APP"
echo "=================================="

# Instalar EAS CLI globalmente
echo "📦 Instalando EAS CLI..."
sudo npm install --global eas-cli

# Verificar se está logado no Expo
echo "🔐 Verificando login no Expo..."
if ! eas whoami &> /dev/null; then
    echo "❌ Você precisa fazer login no EAS primeiro:"
    echo "   eas login"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Inicializar projeto EAS com ID específico
echo "⚙️ Configurando projeto EAS..."
eas init --id 7f0f534c-ef8f-4b53-8fa7-fa9c0503f6e5

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Crie o arquivo .env com as credenciais do Supabase"
    exit 1
fi

# Gerar builds
echo "🏗️ Gerando builds..."
echo "   📱 Android APK"
echo "   🍎 iOS IPA"

eas build --platform all --profile preview --non-interactive

echo ""
echo "🎉 BUILDS CONCLUÍDOS!"
echo "=================================="
echo "📥 Os links para download aparecerão acima"
echo "📱 Android: Baixe o APK e instale"  
echo "🍎 iOS: Use TestFlight ou AltStore"
echo ""
echo "✅ App pronto para teste!"