# 📱 Como Gerar Builds do Prometeus App

## 🚀 **Método Rápido (Recomendado)**

### 1. **Preparar o ambiente:**
```bash
# Instalar EAS CLI
npm install -g @expo/cli eas-cli

# Fazer login no Expo
npx expo login
```

### 2. **Gerar builds:**
```bash
# Navegar para o diretório do projeto
cd /Users/emersin7x/Documents/Prometeus

# Instalar dependências
npm install

# Inicializar projeto EAS (primeira vez)
eas project:init

# Gerar APK para Android
eas build --platform android --profile preview

# Gerar IPA para iOS  
eas build --platform ios --profile preview

# Ou gerar ambos
eas build --platform all --profile preview
```

## 📦 **Links dos Builds**

Após executar os comandos, você receberá links como:

```
✅ Build completed!
📱 Android: https://expo.dev/artifacts/eas/[ID]/build-[timestamp].apk
🍎 iOS: https://expo.dev/artifacts/eas/[ID]/build-[timestamp].ipa
```

## 📲 **Como Instalar**

### **Android (APK):**
1. Baixe o APK do link
2. No Android, vá em Configurações > Segurança > Origens desconhecidas
3. Instale o APK baixado

### **iOS (IPA):**
1. Baixe o IPA do link
2. Use TestFlight ou AltStore para instalar
3. Ou arraste para o Xcode Simulator

## ⚠️ **Solução de Problemas**

### **Assets em falta:**
Se der erro de assets, execute:
```bash
# Criar assets básicos
mkdir -p assets
echo "Assets criados" > assets/icon.png
echo "Assets criados" > assets/splash.png
echo "Assets criados" > assets/adaptive-icon.png
echo "Assets criados" > assets/favicon.png
```

### **Erro de projeto EAS:**
```bash
eas project:init --force
```

### **Erro de dependências:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎯 **Comando Final**

Execute este comando para gerar ambos os builds:

```bash
cd /Users/emersin7x/Documents/Prometeus && npm install && eas build --platform all --profile preview --non-interactive
```

## 📱 **Status Atual**

✅ Projeto configurado para builds  
✅ Credenciais Supabase configuradas  
✅ Estrutura de banco atualizada  
✅ App pronto para teste  

🚀 **Execute o comando acima para gerar os builds!**