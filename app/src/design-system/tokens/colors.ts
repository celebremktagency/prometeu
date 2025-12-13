export const colors = {
 // Backgrounds
 background: {
  primary: '#0A0A0A',   // Fundo principal (preto profundo)
  secondary: '#141414',  // Cards e superfícies
  tertiary: '#1E1E1E',   // Elevações e modais
  elevated: '#252525',   // Cards destacados
 },
 
 // Accent Colors
 accent: {
  primary: '#E4FF1A',   // Amarelo neon (CTAs, destaques)
  secondary: '#00FF88',  // Verde neon (sucesso, progresso)
  tertiary: '#FF6B35',   // Laranja (alertas, streaks)
  gradient: ['#E4FF1A', '#00FF88'], // Gradiente principal
 },
 
 // Text
 text: {
  primary: '#FFFFFF',   // Títulos e texto principal
  secondary: '#A0A0A0',  // Subtítulos e labels
  tertiary: '#666666',   // Texto desabilitado
  inverse: '#0A0A0A',   // Texto em botões accent
 },
 
 // Semantic
 semantic: {
  success: '#00FF88',
  warning: '#FFB800',
  error: '#FF4757',
  info: '#00D4FF',
 },
 
 // Surfaces
 surface: {
  card: 'rgba(255, 255, 255, 0.05)',  // Cards com transparência
  cardHover: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.06)',
 },
 
 // Gradients (para LinearGradient)
 gradients: {
  cardPremium: ['rgba(228, 255, 26, 0.15)', 'rgba(0, 255, 136, 0.05)'] as const,
  cardDark: ['#1A1A1A', '#0F0F0F'] as const,
  streakFire: ['#FF6B35', '#FFB800'] as const,
  progress: ['#E4FF1A', '#00FF88'] as const,
 }
};