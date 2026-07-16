// Presets de background para Storyboard Board
// Fonte: baseado em wonderunit/storyboarder

export const backgroundPresets = [
  {
    id: 'white',
    name: 'White',
    color: '#ffffff',
    type: 'solid',
  },
  {
    id: 'cream',
    name: 'Cream',
    color: '#fef5e7',
    type: 'solid',
  },
  {
    id: 'grid',
    name: 'Grid',
    pattern: 'grid',
    color: 'rgba(204, 238, 0, 0.15)',
  },
  {
    id: 'dots',
    name: 'Dots',
    pattern: 'dots',
    color: 'rgba(204, 238, 0, 0.1)',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    color: '#000080',
    type: 'solid',
  },
  {
    id: 'black',
    name: 'Black',
    color: '#000000',
    type: 'solid',
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    color: '#1a1a2e',
    type: 'solid',
  },
];

export function renderBackground(ctx, backgroundColor, canvasWidth = 1920, canvasHeight = 1080) {
  ctx.save();

  if (backgroundColor.type === 'solid' || !backgroundColor.pattern) {
    // Renderizar cor sólida
    ctx.fillStyle = backgroundColor.color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (backgroundColor.pattern === 'grid') {
    // Grid pattern
    const gridSize = 50;
    ctx.strokeStyle = backgroundColor.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for (let x = 0; x < canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    for (let y = 0; y < canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  } else if (backgroundColor.pattern === 'dots') {
    // Dots pattern
    const dotSize = 2;
    const spacing = 50;
    ctx.fillStyle = backgroundColor.color;

    for (let x = 0; x < canvasWidth; x += spacing) {
      for (let y = 0; y < canvasHeight; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

export function createBackgroundData(backgroundColor) {
  return {
    type: 'background',
    color: backgroundColor.color,
    pattern: backgroundColor.pattern || 'solid',
    opacity: 100,
    visible: true,
    locked: false,
    blendMode: 'source-over',
  };
}

export function isValidBackground(id) {
  return backgroundPresets.some((bg) => bg.id === id);
}

export function getBackgroundById(id) {
  return backgroundPresets.find((bg) => bg.id === id);
}
