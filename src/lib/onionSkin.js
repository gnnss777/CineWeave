// Onion skin para mostrar frames anteriores/próximos
import Konva from 'konva';

export function renderOnionSkin(layer, previousFrame, nextFrame, opacity = 0.3, canvasWidth = 1920, canvasHeight = 1080) {
  const imageObjects = [];

  // Renderizar frame anterior
  if (previousFrame && layer.children.length > 0) {
    const previousLayer = layer.findOne('.onion-skin-previous');
    if (!previousLayer) {
      const image = new Konva.Image({
        x: -20,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        opacity: opacity,
        listening: false,
      });

      const previousContent = previousLayer.toDataURL({
        pixelRatio: 1,
        mimeType: 'image/png',
      });

      image.fromURL(previousContent, () => {
        layer.add(image);
        layer.batchDraw();
      });

      image.id = 'onion-skin-previous';
      imageObjects.push(image);

      // Label
      const label = new Konva.Text({
        x: 20,
        y: 20,
        text: 'PREVIOUS',
        fontSize: 12,
        fontFamily: 'Outfit',
        fill: '#666',
        opacity: 0.8,
        listening: false,
      });

      layer.add(label);
      imageObjects.push(label);
    }
  }

  // Renderizar frame próximo
  if (nextFrame && layer.children.length > 0) {
    const nextLayer = layer.findOne('.onion-skin-next');
    if (!nextLayer) {
      const image = new Konva.Image({
        x: canvasWidth + 20,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        opacity: opacity,
        listening: false,
      });

      const nextContent = nextLayer.toDataURL({
        pixelRatio: 1,
        mimeType: 'image/png',
      });

      image.fromURL(nextContent, () => {
        layer.add(image);
        layer.batchDraw();
      });

      image.id = 'onion-skin-next';
      imageObjects.push(image);

      // Label
      const label = new Konva.Text({
        x: canvasWidth + 40,
        y: 20,
        text: 'NEXT',
        fontSize: 12,
        fontFamily: 'Outfit',
        fill: '#666',
        opacity: 0.8,
        listening: false,
      });

      layer.add(label);
      imageObjects.push(label);
    }
  }

  return layer;
}

export function toggleOnionSkin(layer, enabled) {
  const previousImage = layer.findOne('#onion-skin-previous');
  const nextImage = layer.findOne('#onion-skin-next');
  const previousLabel = layer.findOne('.onion-skin-label-previous');
  const nextLabel = layer.findOne('.onion-skin-label-next');

  if (enabled) {
    if (previousImage) previousImage.visible(true);
    if (nextImage) nextImage.visible(true);
  } else {
    if (previousImage) previousImage.visible(false);
    if (nextImage) nextImage.visible(false);
  }

  layer.batchDraw();
}

export function clearOnionSkin(layer) {
  const previousImage = layer.findOne('#onion-skin-previous');
  const nextImage = layer.findOne('#onion-skin-next');
  const previousLabel = layer.findOne('.onion-skin-label-previous');
  const nextLabel = layer.findOne('.onion-skin-label-next');

  if (previousImage) previousImage.destroy();
  if (nextImage) nextImage.destroy();
  if (previousLabel) previousLabel.destroy();
  if (nextLabel) nextLabel.destroy();

  layer.batchDraw();
}
