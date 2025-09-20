# 🚀 **COMANDOS FINAIS PARA GERAR BUILDS**

## 📱 **Execute exatamente estes comandos:**

### **1. Instalar EAS CLI e inicializar projeto:**
```bash
npm install --global eas-cli && eas init --id 7f0f534c-ef8f-4b53-8fa7-fa9c0503f6e5
```

### **2. Fazer login no EAS (se solicitado):**
```bash
eas login
```

### **3. Instalar dependências:**
```bash
npm install
```

### **4. Gerar builds:**
```bash
# APK para Android
eas build --platform android --profile preview

# IPA para iOS
eas build --platform ios --profile preview

# Ambos (recomendado)
eas build --platform all --profile preview
```

## ✅ **Status do Projeto:**

- ✅ Projeto configurado com ID: `7f0f534c-ef8f-4b53-8fa7-fa9c0503f6e5`
- ✅ Credenciais Supabase configuradas
- ✅ Assets criados
- ✅ EAS configurado

## 📱 **Após o build:**

Você receberá links como:
```
✅ Build completed successfully!
📱 Android APK: https://expo.dev/artifacts/eas/abc123...
🍎 iOS IPA: https://expo.dev/artifacts/eas/def456...
```

## 📲 **Download e Instalação:**

### **Android:**
1. Clique no link do APK
2. Baixe o arquivo
3. Instale no Android (permitir origens desconhecidas)

### **iOS:**
1. Clique no link do IPA
2. Use TestFlight ou AltStore para instalar
3. Ou use no simulador iOS

---

## 🎯 **COMANDO FINAL COMPLETO:**

Execute tudo de uma vez:
```bash
cd /Users/emersin7x/Documents/Prometeus && npm install --global eas-cli && eas login && eas init --id 7f0f534c-ef8f-4b53-8fa7-fa9c0503f6e5 && npm install && eas build --platform all --profile preview
```

**🚀 Pronto! Em 10-15 minutos você terá os builds para baixar!**