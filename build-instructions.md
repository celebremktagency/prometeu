# 📱 Instruções para Gerar Builds do Prometeus App

## 🚀 Pré-requisitos

1. **Conta Expo/EAS CLI:**
   ```bash
   npm install -g @expo/cli eas-cli
   ```

2. **Login no Expo:**
   ```bash
   npx expo login
   ```

3. **Criar projeto EAS (se ainda não criou):**
   ```bash
   eas project:init
   ```

## 📦 Gerar Builds

### 🤖 **Android (APK)**
```bash
# Build de preview (APK para teste)
eas build --platform android --profile preview

# Build de produção (AAB para Play Store)
eas build --platform android --profile production
```

### 🍎 **iOS (IPA)**
```bash
# Build de preview (para TestFlight)
eas build --platform ios --profile preview

# Build de produção (para App Store)
eas build --platform ios --profile production
```

### 🔄 **Ambas as plataformas**
```bash
# Builds simultâneos
eas build --platform all --profile preview
```

## ⚡ **Build Rápido (Apenas para Teste)**

Se você quer apenas testar rapidamente:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar build Android (APK)
eas build --platform android --profile preview --non-interactive

# 3. Gerar build iOS (Simulator)
eas build --platform ios --profile preview --non-interactive
```

## 📋 **Checklist Antes do Build**

- ✅ Arquivo `.env` com credenciais do Supabase
- ✅ Dependências instaladas (`npm install`)
- ✅ Projeto configurado no EAS (`eas project:init`)
- ✅ Login no Expo realizado (`npx expo login`)

## 🔗 **Links dos Builds**

Após executar os comandos, o EAS fornecerá links como:

```
✅ Build completed!
📱 Android APK: https://expo.dev/artifacts/eas/...
🍎 iOS IPA: https://expo.dev/artifacts/eas/...
```

## 📲 **Como Instalar**

### **Android:**
1. Baixe o APK do link fornecido
2. Habilite "Origens desconhecidas" no Android
3. Instale o APK

### **iOS:**
1. Baixe o IPA do link fornecido
2. Use TestFlight ou AltStore para instalar
3. Ou use Xcode Simulator

## ⚠️ **Notas Importantes**

- Builds iOS requerem certificados Apple (automático no EAS)
- Builds podem levar 5-15 minutos
- Links de download ficam disponíveis por 30 dias
- Para distribuição real, use perfil `production`

## 🛠️ **Troubleshooting**

**Erro de autenticação:**
```bash
npx expo logout
npx expo login
```

**Erro de dependências:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Erro de configuração:**
```bash
eas project:init --force
```

---

🚀 **Comando para executar agora:**
```bash
eas build --platform all --profile preview
```