function buildDeckFooter(row) {
  const lines = [];

  const credits = [];

  const creator = row?.creator || row?.created_by || row?.creator_name || "";

  const inspiration = row?.inspiration || row?.inspired_by || "";

  const optimization =
    row?.optimization || row?.optimized_by || row?.optimizer || "";

  if (creator.trim()) {
    credits.push(`Created by ${creator.trim()}`);
  }

  if (inspiration.trim()) {
    credits.push(`Inspired by ${inspiration.trim()}`);
  }

  if (optimization.trim()) {
    credits.push(`Optimized by ${optimization.trim()}`);
  }

  if (credits.length > 0) {
    lines.push(credits.join(", "));
  }

  const suggestedDate = row?.suggested_date || row?.suggested || "";

  const updatedDate = row?.updated_date || row?.updated || "";

  if (suggestedDate) {
    lines.push(`Suggested on ${suggestedDate}`);
  }

  if (updatedDate) {
    lines.push(`Updated on ${updatedDate}`);
  }

  return lines.join("\n");
}

module.exports = buildDeckFooter;
