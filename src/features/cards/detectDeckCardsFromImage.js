const axios = require("axios");
const sharp = require("sharp");

const cardTables = [
  "guardiancards",
  "guardiantricks",
  "kabloomcards",
  "kabloomtricks",
  "megagrowcards",
  "megagrowtricks",
  "smartycards",
  "smartytricks",
  "solarcards",
  "solartricks",
  "beastlycards",
  "beastlytricks",
  "brainycards",
  "brainytricks",
  "crazycards",
  "crazytricks",
  "heartycards",
  "heartytricks",
  "sneakycards",
  "sneakytricks",
];

const CACHE_TTL_MS = 30 * 60 * 1000;
const cardReferenceCache = {
  expiresAt: 0,
  refs: [],
};
const FAILURE_LOG_LIMIT = 8;
const REFERENCE_FETCH_CONCURRENCY = 12;
const REFERENCE_FETCH_TIMEOUT_MS = 6000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function popCountBigInt(n) {
  let value = n;
  let count = 0;
  while (value) {
    value &= value - 1n;
    count++;
  }
  return count;
}

function hammingDistance(hashA, hashB) {
  return popCountBigInt(hashA ^ hashB);
}

function getDiscordFallbackUrls(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return [];

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return [];
  }

  const host = parsed.hostname.toLowerCase();
  const isDiscordHost =
    host === "media.discordapp.net" ||
    host === "cdn.discordapp.com" ||
    host.endsWith(".discordapp.net") ||
    host.endsWith(".discordapp.com");

  if (!isDiscordHost) return [];

  const variants = new Set();

  // Keep same host, drop signed/transform query params.
  const noQuerySameHost = new URL(parsed.toString());
  noQuerySameHost.search = "";
  variants.add(noQuerySameHost.toString());

  // Prefer canonical CDN host for attachments path.
  const cdnNoQuery = new URL(noQuerySameHost.toString());
  cdnNoQuery.hostname = "cdn.discordapp.com";
  variants.add(cdnNoQuery.toString());

  return [...variants].filter((url) => url !== rawUrl);
}

async function fetchImageBufferWithFallback(rawUrl, timeout = 15000) {
  const attempts = [rawUrl, ...getDiscordFallbackUrls(rawUrl)];
  let lastError = null;

  for (const attemptUrl of attempts) {
    try {
      return await fetchImageBufferWithRetry(attemptUrl, timeout);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Image fetch failed");
}

async function fetchImageBufferOnce(url, timeout) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout,
  });
  return Buffer.from(response.data);
}

async function fetchImageBufferWithRetry(url, timeout) {
  try {
    return await fetchImageBufferOnce(url, timeout);
  } catch (error) {
    if (error?.response?.status !== 429) {
      throw error;
    }

    const retryAfterHeader = error.response?.headers?.["retry-after"];
    const retryAfterSeconds = Number.parseFloat(retryAfterHeader);
    if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
      throw error;
    }

    await wait(Math.ceil(retryAfterSeconds * 1000));
    return fetchImageBufferOnce(url, timeout);
  }
}

async function mapWithConcurrency(items, concurrency, task) {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) break;
      results[idx] = await task(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

async function computeDHashFromBuffer(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x];
      const right = data[y * 9 + x + 1];
      hash <<= 1n;
      if (left > right) {
        hash |= 1n;
      }
    }
  }
  return hash;
}

async function getCardReferences(db) {
  const now = Date.now();
  if (cardReferenceCache.refs.length > 0 && cardReferenceCache.expiresAt > now) {
    return cardReferenceCache.refs;
  }

  const unionQuery = cardTables
    .map((table) => `SELECT card_name AS cardName, thumbnail AS thumbnail FROM ${table}`)
    .join(" UNION ALL ");

  const [rows] = await db.query(unionQuery);
  const refs = [];
  const brokenThumbnailCards = new Set();
  const fetchErrorCards = [];
  const candidates = buildReferenceCandidates(rows);

  await mapWithConcurrency(candidates, REFERENCE_FETCH_CONCURRENCY, async ({ cardName, thumbnail }) => {
    try {
      const imageBuffer = await fetchImageBufferWithFallback(thumbnail, REFERENCE_FETCH_TIMEOUT_MS);
      const hash = await computeDHashFromBuffer(imageBuffer);
      refs.push({ cardName, hash });
    } catch (error) {
      if (error?.response?.status === 404) {
        brokenThumbnailCards.add(cardName);
      } else {
        fetchErrorCards.push({ cardName, message: error.message || "unknown error" });
      }
    }
  });

  logReferenceBuildWarnings(brokenThumbnailCards, fetchErrorCards);

  if (refs.length === 0) {
    console.warn("[deck-image-match] No valid card references were built from thumbnail URLs.");
  }

  cardReferenceCache.refs = refs;
  cardReferenceCache.expiresAt = now + CACHE_TTL_MS;
  return refs;
}

function buildReferenceCandidates(rows) {
  const candidates = [];
  const seen = new Set();

  for (const row of rows) {
    const cardName = row.cardName;
    const thumbnail = row.thumbnail;
    if (!cardName || !thumbnail || typeof thumbnail !== "string") continue;
    if (!thumbnail.startsWith("http")) continue;

    const dedupeKey = `${cardName}::${thumbnail}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    candidates.push({ cardName, thumbnail });
  }

  return candidates;
}

function logReferenceBuildWarnings(brokenThumbnailCards, fetchErrorCards) {
  if (brokenThumbnailCards.size > 0) {
    const preview = [...brokenThumbnailCards].slice(0, FAILURE_LOG_LIMIT).join(", ");
    const more = brokenThumbnailCards.size > FAILURE_LOG_LIMIT
      ? ` (+${brokenThumbnailCards.size - FAILURE_LOG_LIMIT} more)`
      : "";
    console.warn(
      `[deck-image-match] Skipped ${brokenThumbnailCards.size} card reference(s) with broken thumbnail URLs (404): ${preview}${more}`
    );
  }

  if (fetchErrorCards.length > 0) {
    const preview = fetchErrorCards
      .slice(0, FAILURE_LOG_LIMIT)
      .map((entry) => `${entry.cardName}: ${entry.message}`)
      .join(" | ");
    const more = fetchErrorCards.length > FAILURE_LOG_LIMIT
      ? ` (+${fetchErrorCards.length - FAILURE_LOG_LIMIT} more)`
      : "";
    console.warn(
      `[deck-image-match] Non-404 thumbnail fetch/hash failures: ${preview}${more}`
    );
  }
}

function pickBestMatch(cropHash, refs, maxDistance) {
  let best = null;
  for (const ref of refs) {
    const distance = hammingDistance(cropHash, ref.hash);
    if (distance > maxDistance) continue;
    if (!best || distance < best.distance) {
      best = { cardName: ref.cardName, distance };
    }
  }
  return best;
}

async function extractListLayoutCrops(image) {
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height) return [];

  const listLeft = Math.floor(width * 0.52);
  const listWidth = Math.floor(width * 0.45);
  const top = Math.floor(height * 0.12);
  const bottom = Math.floor(height * 0.92);
  const listHeight = Math.max(1, bottom - top);
  const rows = 10;
  const rowHeight = Math.floor(listHeight / rows);

  const crops = [];
  for (let i = 0; i < rows; i++) {
    const rowTop = top + i * rowHeight;
    const iconSize = Math.max(12, Math.floor(rowHeight * 0.78));
    const iconLeft = listLeft + Math.floor(listWidth * 0.02);
    const iconTop = rowTop + Math.max(0, Math.floor((rowHeight - iconSize) / 2));

    if (iconLeft + iconSize > width || iconTop + iconSize > height) continue;

    const crop = await image
      .clone()
      .extract({
        left: iconLeft,
        top: iconTop,
        width: iconSize,
        height: iconSize,
      })
      .png()
      .toBuffer();
    crops.push(crop);
  }

  return crops;
}

async function extractGridLayoutCrops(image) {
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height) return [];

  const left = Math.floor(width * 0.06);
  const right = Math.floor(width * 0.94);
  const top = Math.floor(height * 0.24);
  const bottom = Math.floor(height * 0.95);
  const gridWidth = Math.max(1, right - left);
  const gridHeight = Math.max(1, bottom - top);

  const cols = 4;
  const rows = 10;
  const cellWidth = Math.floor(gridWidth / cols);
  const cellHeight = Math.floor(gridHeight / rows);

  const crops = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellLeft = left + col * cellWidth;
      const cellTop = top + row * cellHeight;

      const insetX = Math.floor(cellWidth * 0.12);
      const insetY = Math.floor(cellHeight * 0.12);
      const cropWidth = Math.max(12, Math.floor(cellWidth * 0.76));
      const cropHeight = Math.max(12, Math.floor(cellHeight * 0.76));

      const cropLeft = cellLeft + insetX;
      const cropTop = cellTop + insetY;

      if (cropLeft + cropWidth > width || cropTop + cropHeight > height) continue;

      const crop = await image
        .clone()
        .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
        .png()
        .toBuffer();
      crops.push(crop);
    }
  }

  return crops;
}

function summarizeMatches(matches, minHits = 1) {
  const counts = new Map();
  const bestDistance = new Map();

  for (const match of matches) {
    counts.set(match.cardName, (counts.get(match.cardName) || 0) + 1);
    const prevBest = bestDistance.get(match.cardName);
    if (prevBest === undefined || match.distance < prevBest) {
      bestDistance.set(match.cardName, match.distance);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= minHits)
    .map(([cardName, count]) => ({
      cardName,
      count,
      bestDistance: bestDistance.get(cardName),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (a.bestDistance || 99) - (b.bestDistance || 99);
    });
}

async function detectDeckCardsFromImage(db, imageUrl) {
  try {
    const refs = await getCardReferences(db);
    if (!refs.length) {
      return {
        cards: [],
        cardsText: "",
        mode: "none",
        matchedSlots: 0,
        totalSlotsScanned: 0,
      };
    }

    const imageBuffer = await fetchImageBufferWithFallback(imageUrl, 20000);
    const image = sharp(imageBuffer);

    const listCrops = await extractListLayoutCrops(image);
    const gridCrops = await extractGridLayoutCrops(image);

    const listMatches = [];
    for (const crop of listCrops) {
      const hash = await computeDHashFromBuffer(crop);
      const best = pickBestMatch(hash, refs, 12);
      if (best) listMatches.push(best);
    }

    const gridMatches = [];
    for (const crop of gridCrops) {
      const hash = await computeDHashFromBuffer(crop);
      const best = pickBestMatch(hash, refs, 10);
      if (best) gridMatches.push(best);
    }

    const listSummary = summarizeMatches(listMatches, 1);
    const gridSummary = summarizeMatches(gridMatches, 2);

    const useList = listSummary.length >= 8 || listMatches.length >= 8;
    const chosenSummary = useList ? listSummary : gridSummary;
    const chosenMode = useList ? "list" : "grid";
    const cards = chosenSummary.map((entry) => entry.cardName);

    return {
      cards,
      cardsText: cards.join("\n"),
      mode: chosenMode,
      matchedSlots: useList ? listMatches.length : gridMatches.length,
      totalSlotsScanned: useList ? listCrops.length : gridCrops.length,
    };
  } catch (error) {
    console.error("[deck-image-match] detection failed:", error);
    return {
      cards: [],
      cardsText: "",
      mode: "error",
      matchedSlots: 0,
      totalSlotsScanned: 0,
      error: error.message,
    };
  }
}

module.exports = { detectDeckCardsFromImage };