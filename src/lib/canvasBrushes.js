// Configurações de brushes para Storyboard Board
// Fonte: baseado em wonderunit/storyboarder

export const brushPresets = [
  {
    id: 'light-pencil',
    name: 'Light Pencil',
    width: 2,
    color: '#ffffff',
    opacity: 0.5,
    pressure: 0.1,
    smoothing: 0.3,
  },
  {
    id: 'pencil',
    name: 'Pencil',
    width: 3,
    color: '#e0e0e0',
    opacity: 0.8,
    pressure: 0.2,
    smoothing: 0.5,
  },
  {
    id: 'pen',
    name: 'Pen',
    width: 1.5,
    color: '#ccee00',
    opacity: 1,
    pressure: 0,
    smoothing: 0.2,
  },
  {
    id: 'brush',
    name: 'Brush',
    width: 5,
    color: '#ccee00',
    opacity: 0.9,
    pressure: 0.6,
    smoothing: 0.7,
  },
  {
    id: 'ink-brush',
    name: 'Ink Brush',
    width: 8,
    color: '#ccee00',
    opacity: 0.85,
    pressure: 0.8,
    smoothing: 0.8,
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    width: 6,
    color: '#888888',
    opacity: 0.6,
    pressure: 0.5,
    smoothing: 0.4,
  },
  {
    id: 'eraser',
    name: 'Eraser',
    width: 8,
    color: '#000000',
    opacity: 1,
    pressure: 0.6,
    smoothing: 0.6,
  },
];

export const inkBrushes = [
  {
    id: 'pen',
    name: 'Pen',
    width: 1.5,
    color: '#ccee00',
    opacity: 1,
    smoothing: 0.2,
  },
  {
    id: 'brush',
    name: 'Brush',
    width: 5,
    color: '#ccee00',
    opacity: 0.9,
    smoothing: 0.7,
  },
  {
    id: 'ink-brush',
    name: 'Ink Brush',
    width: 8,
    color: '#ccee00',
    opacity: 0.85,
    smoothing: 0.8,
  },
];

// Calibração de pressure baseado no dispositivo
export function calibratePressure(rawPressure, deviceType) {
  let calibrated;

  switch (deviceType) {
    case 'pen':
      calibrated = rawPressure;
      break;
    case 'stylus':
      calibrated = rawPressure;
      break;
    case 'mouse':
      calibrated = Math.min(1, Math.max(0, rawPressure * 0.1));
      break;
    case 'touch':
      calibrated = 0.5;
      break;
    default:
      calibrated = 0.5;
  }

  return calibrated;
}

// Aplicar pressão ao width do brush
export function applyPressure(baseWidth, pressure, maxPressure = 1) {
  const scaleFactor = 0.3 + pressure * 0.7; // 0.3x a 1.0x
  return Math.max(1, baseWidth * scaleFactor);
}

// Smoothing para traços (curvas quadratic bezier)
export function applySmoothing(points, smoothingFactor = 0.5) {
  const smoothed = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    if (i === 0) {
      smoothed.push({
        x: p0.x,
        y: p0.y,
        width: p0.width,
        pressure: p0.pressure,
      });
      continue;
    }

    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    const midWidth = (p0.width + p1.width) / 2;
    const midPressure = (p0.pressure + p1.pressure) / 2;

    smoothed.push({
      x: midX,
      y: midY,
      width: midWidth,
      pressure: midPressure,
    });
  }

  return smoothed;
}

// Calcular velocidade do pointer
export function calculateVelocity(prev, curr) {
  const dt = (curr.time - prev.time) / 1000;
  if (dt === 0) return 0;
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  return Math.sqrt(dx * dx + dy * dy) / dt;
}

// Calcular pontuação de velocidade para brush width ajustado
export function adjustWidthByVelocity(baseWidth, velocity, maxVelocity = 200) {
  const velocityFactor = Math.min(1, velocity / maxVelocity);
  return Math.max(1, baseWidth * (1 - velocityFactor * 0.5));
}
