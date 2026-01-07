const axios = require('axios');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const {detectPVZCardGrid} = require('./detectPVZCardGrid');
async function validateDeckImage(imageUrl) {
  try {
    /* -----------------------------------
       LOAD IMAGE
    ----------------------------------- */
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const image = sharp(response.data);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels || 3;

    /* -----------------------------------
       OCR (RUN ONCE, REUSED EVERYWHERE)
    ----------------------------------- */
    const ocr = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}
    });

    const text = ocr.data.text || '';
    const lower = text.toLowerCase();

    /* ======================================================
       STAGE 1 — IS THIS A PVZ HEROES DECK?
       (Hard gate, instant reject)
    ====================================================== */
    const deckSizePresent =
      lower.includes('40/40') ||
      lower.includes('40 40') ||
      lower.includes('4o/4o') ||
      lower.includes('4o 4o');

    const quantityMatches = (lower.match(/x[1-4]/g) || []).length;
    
    const grid = detectPVZCardGrid(data, width, height, channels);
    if (!grid.hasGrid) {
      // OCR fallback only
      if (!deckSizePresent && quantityMatches < 3) {
        return {
          isValid: false,
          reason: 'not_pvz_heroes_deck',
          debug: { grid, deckSizePresent, quantityMatches }
        };
      }
    }
  
      /* ======================================================
       STAGE 2 — DETECT EDITS / ANNOTATIONS / MEMES
    ====================================================== */

    let flags = [];

    /* ---------- 2A: Large red scribbles / arrows ---------- */
    // Check for large red annotation clusters (arrows, scribbles)
    const visited = new Uint8Array(width * height);

    const isAnnotationRed = (i) => {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Ultra-strict red detection for annotations (pure red scribbles/arrows)
      return r > 245 && g < 50 && b < 50;
    };

    let largestRedCluster = 0;

    for (let i = 0; i < width * height; i++) {
      if (visited[i]) continue;

      const p = i * channels;
      if (!isAnnotationRed(p)) continue;

      let stack = [i];
      let size = 0;

      while (stack.length) {
        const cur = stack.pop();
        if (visited[cur]) continue;
        visited[cur] = 1;

        const cp = cur * channels;
        if (!isAnnotationRed(cp)) continue;

        size++;

        const x = cur % width;
        const y = Math.floor(cur / width);

        if (x > 0) stack.push(cur - 1);
        if (x < width - 1) stack.push(cur + 1);
        if (y > 0) stack.push(cur - width);
        if (y < height - 1) stack.push(cur + width);
      }

      if (size > largestRedCluster) largestRedCluster = size;
    }

    // Significantly increased threshold: only flag massive red annotations (10000+ pixels)
    if (largestRedCluster > 10000) {
      flags.push('red_annotations');
    }

    /* ---------- 2B: Non-deck / meme text ---------- */
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

    if (bannedWords.some(w => lower.includes(w))) {
      flags.push('non_game_text');
    }

    /* ---------- 2B2: Detect overlay images (STOP signs, random images) ---------- */
    // Check for unusually bright white regions (overlays often have white backgrounds)
    let brightWhitePixels = 0;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Pure white or near-white (overlay backgrounds)
      if (r > 240 && g > 240 && b > 240) {
        brightWhitePixels++;
      }
    }
    
    const whiteRatio = brightWhitePixels / (width * height);
    // PvZ decks rarely have >5% pure white pixels
    if (whiteRatio > 0.05) {
      flags.push('overlay_images');
    }

    /* ---------- 2C: Handwritten / sentence-like text ---------- */
    const sentenceLike =
      text.length > 120 &&
      quantityMatches < 10 &&
      (text.match(/[a-z]{5,}\s+[a-z]{5,}/gi) || []).length > 2;

    if (sentenceLike) {
      flags.push('handwritten_or_overlay_text');
    }

    /* ---------- 2C2: Detect high color diversity (photos/overlays) ---------- */
    // Group pixels by color bins to detect if there are too many distinct colors
    const colorBins = new Map();
    for (let i = 0; i < data.length; i += channels * 50) { // Sample every 50 pixels
      const r = Math.floor(data[i] / 32);
      const g = Math.floor(data[i + 1] / 32);
      const b = Math.floor(data[i + 2] / 32);
      const bin = `${r}-${g}-${b}`;
      colorBins.set(bin, (colorBins.get(bin) || 0) + 1);
    }
    
    // PvZ decks have consistent color palette (card art), overlays add excessive random colors
    // Very high threshold: normal decks ~150-250, meme overlays often 300+
    if (colorBins.size > 280) {
      flags.push('excessive_color_diversity');
    }

    /* ---------- 2D: Photo / meme entropy detection ---------- */
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

    // Meme photos spike variance heavily - increased threshold
    if (variance > 9000 && text.length > 150) {
      flags.push('photo_or_meme_overlay');
    }

    // Grid detection validates structure, flags indicate content issues
    // If grid detected: allow 1-2 minor flags (UI elements), but ban meme/annotation flags
    // If no grid: need strong OCR signals and fewer flags
    const criticalFlags = flags.filter(f => 
      f === 'red_annotations' || 
      f === 'non_game_text' || 
      f === 'handwritten_or_overlay_text' ||
      f === 'overlay_images'
    );

    let isValid;
    if (grid.hasGrid) {
      // Grid detected: reject only if critical flags present
      isValid = criticalFlags.length === 0;
    } else {
      // No grid: need OCR confirmation AND no critical flags
      isValid = (deckSizePresent || quantityMatches >= 3) && criticalFlags.length === 0;
    }

    console.log('[Deck OCR]', {
      deckSizePresent,
      quantityMatches,
      hasGrid: grid.hasGrid,
      flags,
      criticalFlags,
      variance,
      colorBins: colorBins.size,
      isValid
    });

    return {
      isValid,
      flags,
      criticalFlags,
      detectedTextSample: text.substring(0, 200)
    };

      }    catch (error) {
    console.error('[Deck Validation Error]', error);
    return {
      isValid: false,
      reason: 'validation_error',
      error: error.message
    };
  }
}

module.exports = { validateDeckImage };
