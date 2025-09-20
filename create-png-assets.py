#!/usr/bin/env python3
"""
Script para gerar assets PNG simples para o app Prometeus
Requer: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ Pillow não instalado. Execute: pip install Pillow")
    exit(1)

def create_icon(size, filename, bg_color="#06C7C3", text_color="#FFFFFF"):
    """Cria um ícone com a letra P"""
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Tentar usar uma fonte melhor, senão usar padrão
    try:
        font_size = int(size * 0.4)
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Desenhar bordas arredondadas (aproximação)
    radius = int(size * 0.15)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=bg_color)
    
    # Adicionar texto
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)  # Ajuste para centralizar melhor
    
    draw.text((x, y), text, fill=text_color, font=font)
    
    img.save(filename)
    print(f"✅ {filename} criado ({size}x{size})")

def create_splash(filename):
    """Cria splash screen"""
    img = Image.new('RGB', (1284, 2778), '#FFFFFF')
    draw = ImageDraw.Draw(img)
    
    # Círculo central
    center_x, center_y = 642, 1200
    radius = 120
    draw.ellipse([center_x-radius, center_y-radius, center_x+radius, center_y+radius], fill='#06C7C3')
    
    # Texto P no círculo
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 96)
        font_medium = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 48)
        font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # P no círculo
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    x = center_x - text_width // 2
    y = center_y - 40
    draw.text((x, y), text, fill='#FFFFFF', font=font_large)
    
    # Nome do app
    text = "Prometeus"
    bbox = draw.textbbox((0, 0), text, font=font_medium)
    text_width = bbox[2] - bbox[0]
    x = center_x - text_width // 2
    draw.text((x, 1380), text, fill='#0F1724', font=font_medium)
    
    # Subtítulo
    text = "Treinos Patológicos"
    bbox = draw.textbbox((0, 0), text, font=font_small)
    text_width = bbox[2] - bbox[0]
    x = center_x - text_width // 2
    draw.text((x, 1450), text, fill='#6B7280', font=font_small)
    
    img.save(filename)
    print(f"✅ {filename} criado (1284x2778)")

# Criar diretório assets
os.makedirs('assets', exist_ok=True)

# Gerar todos os assets
create_icon(1024, 'assets/icon.png')
create_icon(1024, 'assets/adaptive-icon.png', bg_color='#06C7C3')
create_icon(512, 'assets/favicon.png')
create_splash('assets/splash.png')

print("\n🎉 Todos os assets PNG foram gerados!")
print("📱 Agora você pode executar: eas build --platform all --profile preview")