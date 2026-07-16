// Renderizador de traços de tinta para Canvas
import { applyPressure, applySmoothing } from './canvasBrushes';

export function createInkStroke(points, brush) {
  const strokeWidths = points.map((p) =>
    applyPressure(brush.width, p.pressure, 1)
  );
  const smoothedPoints = applySmoothing(points, brush.smoothing);

  return {
    type: 'ink',
    points: smoothedPoints,
    strokeWidths,
    color: brush.color,
    opacity: brush.opacity,
  };
}

export function renderInkToCanvas(ctx, stroke) {
  if (stroke.points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = stroke.opacity;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color;

  // Desenhar caminho com curvas quadratic bezier
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p0 = stroke.points[i];
    const p1 = stroke.points[i + 1];
    const w0 = stroke.strokeWidths[i];
    const w1 = stroke.strokeWidths[i + 1];

    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    const midW = (w0 + w1) / 2;

    ctx.lineWidth = midW;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(midX, midY, p1.x, p1.y);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderPath(ctx, pathData) {
  ctx.save();
  ctx.strokeStyle = pathData.color || '#ffffff';
  ctx.lineWidth = pathData.width || 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = pathData.opacity || 1;

  if (pathData.points && pathData.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(pathData.points[0].x, pathData.points[0].y);
    pathData.points.forEach((p, i) => {
      if (i > 0) {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.stroke();
  }

  ctx.restore();
}

export function renderRect(ctx, rectData) {
  ctx.save();
  ctx.fillStyle = rectData.fill || '#ffffff';
  ctx.strokeStyle = rectData.stroke || '#ffffff';
  ctx.lineWidth = rectData.strokeWidth || 2;
  ctx.globalAlpha = rectData.opacity || 1;

  const x = rectData.x || 0;
  const y = rectData.y || 0;
  const width = rectData.width || 100;
  const height = rectData.height || 100;

  if (rectData.fill) {
    ctx.fillRect(x, y, width, height);
  }

  if (rectData.stroke) {
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

export function renderCircle(ctx, circleData) {
  ctx.save();
  ctx.fillStyle = circleData.fill || '#ffffff';
  ctx.strokeStyle = circleData.stroke || '#ffffff';
  ctx.lineWidth = circleData.strokeWidth || 2;
  ctx.globalAlpha = circleData.opacity || 1;

  const x = circleData.x || 0;
  const y = circleData.y || 0;
  const radius = circleData.radius || 50;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (circleData.fill) {
    ctx.fill();
  }

  if (circleData.stroke) {
    ctx.stroke();
  }

  ctx.restore();
}

export function renderText(ctx, textData) {
  ctx.save();
  ctx.font = `${textData.fontSize || 24}px ${textData.fontFamily || 'Outfit'}`;
  ctx.fillStyle = textData.fill || '#ffffff';
  ctx.globalAlpha = textData.opacity || 1;

  if (textData.text) {
    if (textData.x && textData.y) {
      ctx.fillText(textData.text, textData.x, textData.y);
    } else if (textData.x && textData.y) {
      ctx.textAlign = textData.textAlign || 'left';
      ctx.textBaseline = textData.textBaseline || 'top';
      ctx.fillText(textData.text, textData.x, textData.y);
    }
  }

  ctx.restore();
}

export function renderImage(ctx, imageData) {
  if (!imageData.src || !imageData.x || !imageData.y) return;

  ctx.save();
  ctx.globalAlpha = imageData.opacity || 1;

  if (imageData.width && imageData.height) {
    ctx.drawImage(imageData.src, imageData.x, imageData.y, imageData.width, imageData.height);
  } else {
    ctx.drawImage(imageData.src, imageData.x, imageData.y);
  }

  ctx.restore();
}

export function renderLayer(ctx, layerData) {
  switch (layerData.type) {
    case 'path':
      renderPath(ctx, layerData);
      break;
    case 'rect':
      renderRect(ctx, layerData);
      break;
    case 'circle':
      renderCircle(ctx, layerData);
      break;
    case 'text':
      renderText(ctx, layerData);
      break;
    case 'image':
      renderImage(ctx, layerData);
      break;
    default:
      break;
  }
}
