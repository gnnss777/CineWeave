// Suporte a Wacom e Pointer Events para Canvas
import { calibratePressure, applyPressure } from './canvasBrushes';

export function getPointerPressure(event) {
  if (event.pointerType === 'pen') {
    return event.pressure || 0.5;
  }
  if (event.pointerType === 'stylus') {
    return event.pressure || 0.5;
  }
  return 0.5; // Default for mouse
}

export function getPointerDeviceType(event) {
  if (event.pointerType === 'pen') return 'pen';
  if (event.pointerType === 'stylus') return 'stylus';
  if (event.pointerType === 'touch') return 'touch';
  if (event.pointerType === 'mouse') return 'mouse';
  return 'unknown';
}

export function handlePointerDown(ctx, event, brush) {
  const x = event.clientX - ctx.offsetLeft;
  const y = event.clientY - ctx.offsetTop;
  const pressure = getPointerPressure(event);
  const deviceType = getPointerDeviceType(event);

  const adjustedWidth = applyPressure(brush.width, pressure, 1);

  return {
    x,
    y,
    width: adjustedWidth,
    pressure: calibratePressure(pressure, deviceType),
    time: Date.now(),
    deviceType,
  };
}

export function handlePointerMove(ctx, event, startPoint, brush) {
  const x = event.clientX - ctx.offsetLeft;
  const y = event.clientY - ctx.offsetTop;
  const pressure = getPointerPressure(event);
  const deviceType = getPointerDeviceType(event);
  const time = Date.now();

  const velocity = calculateVelocity(startPoint, { x, y, time });
  const adjustedWidth = applyPressure(brush.width, pressure, 1);

  return {
    x,
    y,
    width: adjustedWidth,
    pressure: calibratePressure(pressure, deviceType),
    time,
    velocity,
    deviceType,
  };
}

function calculateVelocity(prev, curr) {
  const dt = (curr.time - prev.time) / 1000;
  if (dt === 0) return 0;
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  return Math.sqrt(dx * dx + dy * dy) / dt;
}

// Configurar pointer capture para canvas
export function setPointerCapture(canvas) {
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointerleave', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);

  // Prevenir scroll quando estiver desenhando no canvas
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
  }, { passive: false });
}

export function handlePointerUp(event) {
  // Cleanup
}

// Configurar para multi-touch (pinch zoom)
export function setupMultiTouch(canvas, setScale, setPanX, setPanY) {
  let touchDistance = null;
  let startPanX = null;
  let startPanY = null;
  let startScale = 1;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      touchDistance = calculateTouchDistance(e.touches);
      startPanX = calculateTouchCenter(e.touches).x;
      startPanY = calculateTouchCenter(e.touches).y;
      startScale = getScale();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && touchDistance !== null) {
      const currentDistance = calculateTouchDistance(e.touches);
      const currentCenter = calculateTouchCenter(e.touches);

      const scaleChange = currentDistance / touchDistance;
      const newScale = Math.max(0.25, Math.min(4, startScale * scaleChange));

      setScale(newScale);

      const panXChange = currentCenter.x - startPanX;
      const panYChange = currentCenter.y - startPanY;
      setPanX((prev) => prev + panXChange);
      setPanY((prev) => prev + panYChange);

      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single touch move - desenha
      handleTouchMove(e.touches[0]);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    touchDistance = null;
  });
}

function calculateTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateTouchCenter(touches) {
  const x = (touches[0].clientX + touches[1].clientX) / 2;
  const y = (touches[0].clientY + touches[1].clientY) / 2;
  return { x, y };
}

function getScale() {
  return 1; // This would come from React state
}

function handleTouchMove(touch) {
  // Implementar draw stroke aqui
}
