export const colors = {
  bg: "#FFFFFF",                // página
  surface: "#F7F8FA",           // cartões
  cardBorder: "#ECEFF2",        // bordas leves
  textPrimary: "#0F1724",       // texto escuro principal
  textSecondary: "#6B7280",     // texto secundário
  accent: "#06C7C3",            // ciano/teal (principal)
  accentDark: "#05A99A",
  danger: "#FF4D6D",            // dor / alerta
  neutralLight: "#F1F3F5",
  shadow: "rgba(15,23,36,0.06)"
};

export const typography = {
  fontFamilyPrimary: "Poppins", // usar Poppins (ou Inter se necessário) -> declare no Expo
  h1: { size: 42, weight: 700, lineHeight: 48 },
  h2: { size: 32, weight: 600, lineHeight: 40 },
  h3: { size: 24, weight: 600, lineHeight: 32 },
  body: { size: 16, weight: 400, lineHeight: 24 },
  small: { size: 14, weight: 400, lineHeight: 20 },
  caption: { size: 12, weight: 400, lineHeight: 16 }
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const radii = {
  pill: 9999,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28
};

export const shadows = {
  low: `0px 6px 16px ${colors.shadow}`,
  mid: `0px 8px 24px rgba(15,23,36,0.08)`
};