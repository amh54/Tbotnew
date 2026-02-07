function detectPVZCardGrid(data, width, height, channels) {
  const hits = [];

  // Focus on lower 70% where deck cards are
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.95);

  for (let y = startY; y < endY; y += 6) {
    for (let x = 0; x < width; x += 6) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Card art has strong local contrast
      if (Math.max(r, g, b) - Math.min(r, g, b) > 50) {
        hits.push({ x, y });
      }
    }
  }

  // Bucket by X (columns)
  const xBuckets = {};
  for (const p of hits) {
    const bucket = Math.round(p.x / 130);
    xBuckets[bucket] = (xBuckets[bucket] || 0) + 1;
  }

  // Count valid columns (must have many hits)
  const columns = Object.values(xBuckets).filter(v => v > 60).length;

  // Bucket by Y (rows)
  const yBuckets = {};
  for (const p of hits) {
    const bucket = Math.round(p.y / 110);
    yBuckets[bucket] = (yBuckets[bucket] || 0) + 1;
  }

  const rows = Object.values(yBuckets).filter(v => v > 40).length;

  return {
    hasGrid: columns >= 4 && rows >= 3,
    columns,
    rows
  };
}
module.exports = { detectPVZCardGrid };