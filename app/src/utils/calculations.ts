export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const roundToDecimals = (value: number, decimals: number = 1): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const interpolate = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number]
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;
  
  const ratio = (value - inputMin) / (inputMax - inputMin);
  return outputMin + ratio * (outputMax - outputMin);
};

export const getPainLevelText = (level: number): string => {
  if (level === 0) return 'Sem dor';
  if (level <= 2) return 'Dor leve';
  if (level <= 4) return 'Dor moderada';
  if (level <= 6) return 'Dor intensa';
  if (level <= 8) return 'Dor muito intensa';
  return 'Dor extrema';
};

export const getProgressText = (progress: number): string => {
  if (progress === 0) return 'Nenhum treino';
  if (progress === 1) return '1 treino';
  return `${progress} treinos`;
};