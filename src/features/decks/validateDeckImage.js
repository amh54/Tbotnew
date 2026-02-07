const axios = require('axios');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const {detectPVZCardGrid} = require('../cards/detectPVZCardGrid');

function checkDeckSizePresent(lower) {
  return lower.includes('40/40') ||
    lower.includes('40 40') ||
    lower.includes('4o/4o') ||
    lower.includes('4o 4o');
}

function getQuantityMatches(lower) {
  return (lower.match(/x[1-4]/g) || []).length;
}

function isAnnotationRed(data, pixelIndex) {
  const r = data[pixelIndex];
  const g = data[pixelIndex + 1];
  const b = data[pixelIndex + 2];
  return r > 245 && g < 50 && b < 50;
}

function floodFill(startIndex, data, width, height, channels, visited) {
  let stack = [startIndex];
  let size = 0;

  while (stack.length) {
    const cur = stack.pop();
    if (visited[cur]) continue;
    visited[cur] = 1;

    const cp = cur * channels;
    if (!isAnnotationRed(data, cp)) continue;

    size++;

    const x = cur % width;
    const y = Math.floor(cur / width);

    if (x > 0) stack.push(cur - 1);
    if (x < width - 1) stack.push(cur + 1);
    if (y > 0) stack.push(cur - width);
    if (y < height - 1) stack.push(cur + width);
  }

  return size;
}

function detectRedAnnotations(data, width, height, channels) {
  const visited = new Uint8Array(width * height);
  let largestRedCluster = 0;

  for (let i = 0; i < width * height; i++) {
    if (visited[i]) continue;

    const p = i * channels;
    if (!isAnnotationRed(data, p)) continue;

    const size = floodFill(i, data, width, height, channels, visited);
    if (size > largestRedCluster) largestRedCluster = size;
  }

  return largestRedCluster > 10000;
}

function checkBannedWords(lower) {
  const bannedWords = [
    'dumbass',
    'wasn\'t',
    'what was he cooking',
    'here',
    'lol',
    'lmao',
    'meme',
    'stop'
  ];
  return bannedWords.some(w => lower.includes(w));
}

function detectOverlayImages(data, width, height, channels) {
  let brightWhitePixels = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 240 && g > 240 && b > 240) {
      brightWhitePixels++;
    }
  }
  const whiteRatio = brightWhitePixels / (width * height);
  return whiteRatio > 0.05;
}

function detectHandwrittenText(text, quantityMatches) {
  return text.length > 120 &&
    quantityMatches < 10 &&
    (text.match(/[a-z]{5,}\s+[a-z]{5,}/gi) || []).length > 2;
}

function getColorDiversity(data, width, height, channels) {
  const colorBins = new Map();
  for (let i = 0; i < data.length; i += channels * 50) {
    const r = Math.floor(data[i] / 32);
    const g = Math.floor(data[i + 1] / 32);
    const b = Math.floor(data[i + 2] / 32);
    const bin = `${r}-${g}-${b}`;
    colorBins.set(bin, (colorBins.get(bin) || 0) + 1);
  }
  return colorBins.size;
}

function calculateVariance(data, width, height, channels) {
  let mean = 0;
  let variance = 0;

  for (let i = 0; i < data.length; i += channels) {
    mean += (data[i] + data[i+1] + data[i+2]) / 3;
  }
  mean /= (width * height);

  for (let i = 0; i < data.length; i += channels) {
    const v = (data[i] + data[i+1] + data[i+2]) / 3;
    variance += (v - mean) ** 2;
  }
  variance /= (width * height);

  return variance;
}

function buildFlagsList(largestRedCluster, lower, text, quantityMatches, colorDiversity, variance) {
  const flags = [];

  if (largestRedCluster > 10000) {
    flags.push('red_annotations');
  }

  if (checkBannedWords(lower)) {
    flags.push('non_game_text');
  }

  if (detectOverlayImages(...arguments.slice(1, 5))) {
    flags.push('overlay_images');
  }

  if (detectHandwrittenText(text, quantityMatches)) {
    flags.push('handwritten_or_overlay_text');
  }

  if (colorDiversity > 280) {
    flags.push('excessive_color_diversity');
  }

  if (variance > 9000 && text.length > 150) {
    flags.push('photo_or_meme_overlay');
  }

  return flags;
}

function getCriticalFlags(flags) {
  return flags.filter(f => 
    f === 'red_annotations' || 
    f === 'non_game_text' || 
    f === 'handwritten_or_overlay_text' ||
    f === 'overlay_images'
  );
}

function determineValidity(grid, deckSizePresent, quantityMatches, criticalFlags) {
  if (grid.hasGrid) {
    return criticalFlags.length === 0;
  }
  return (deckSizePresent || quantityMatches >= 3) && criticalFlags.length === 0;
}

async function validateDeckImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const image = sharp(response.data);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels || 3;

    const ocr = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}
    });

    const text = ocr.data.text || '';
    const lower = text.toLowerCase();

    const deckSizePresent = checkDeckSizePresent(lower);
    const quantityMatches = getQuantityMatches(lower);
    
    const grid = detectPVZCardGrid(data, width, height, channels);
    if (!grid.hasGrid && !deckSizePresent && quantityMatches < 3) {
      return {
        isValid: false,
        reason: 'not_pvz_heroes_deck',
        debug: { grid, deckSizePresent, quantityMatches }
      };
    }

    const largestRedCluster = detectRedAnnotations(data, width, height, channels) ? 10001 : 0;
    const colorDiversity = getColorDiversity(data, width, height, channels);
    const variance = calculateVariance(data, width, height, channels);

    const flags = buildFlagsList(largestRedCluster, lower, text, quantityMatches, colorDiversity, variance);
    const criticalFlags = getCriticalFlags(flags);
    const isValid = determineValidity(grid, deckSizePresent, quantityMatches, criticalFlags);

    console.log('[Deck OCR]', {
      deckSizePresent,
      quantityMatches,
      hasGrid: grid.hasGrid,
      flags,
      criticalFlags,
      variance,
      colorBins: colorDiversity,
      isValid
    });

    return {
      isValid,
      flags,
      criticalFlags,
      detectedTextSample: text.substring(0, 200)
    };

  } catch (error) {
    console.error('[Deck Validation Error]', error);
    return {
      isValid: false,
      reason: 'validation_error',
      error: error.message
    };
  }
}

module.exports = { validateDeckImage };
