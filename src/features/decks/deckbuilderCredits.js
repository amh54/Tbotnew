function normalizeCreditName(value) {
  return (value || "")
    .toString()
    .replace(/&#x20;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^by\s+/gi, "")
    .replace(/\?+$/g, "")
    .trim();
}


function comparableName(value) {
  return normalizeCreditName(value)
    .replace(/\s+/g, "")
    .toLowerCase();
}


function splitCreditNames(value) {
  if (!value) return [];

  return value
    .toString()
    .replace(/&#x20;/gi, " ")
    .replace(/\r?\n+/g, ",")
    .replace(/\s+(and|&)\s+/gi, ",")
    .replace(/\//g, ",")
    .split(",")
    .map(normalizeCreditName)
    .filter(Boolean);
}


function extractDeckbuilderNames(creator) {
  if (!creator) return [];

  const text = creator.toString().trim();

  const names = [];


  // NEW FORMAT
  // Created By Xera, Inspired By Bob, Optimized By Joe
  if (/created\s+by/i.test(text)) {

    const createdMatch = text.match(
      /Created\s+By\s+(.+?)(?=,\s*Inspired\s+By|,\s*Optimized\s+By|Suggested\s+on|Updated\s+on|$)/i
    );


    const inspiredMatch = text.match(
      /Inspired\s+By\s+(.+?)(?=,\s*Optimized\s+By|Suggested\s+on|Updated\s+on|$)/i
    );


    const optimizedMatch = text.match(
      /Optimized\s+By\s+(.+?)(?=Suggested\s+on|Updated\s+on|$)/i
    );


    if (createdMatch) {
      names.push(...splitCreditNames(createdMatch[1]));
    }


    if (inspiredMatch) {
      names.push(...splitCreditNames(inspiredMatch[1]));
    }


    if (optimizedMatch) {
      names.push(...splitCreditNames(optimizedMatch[1]));
    }

  } 
  
  // OLD FORMAT
  // Xera
  // Xera and Shortbow
  // Xera & Salt
  else {
    names.push(...splitCreditNames(text));
  }


  return [...new Set(names)];
}



function getDeckbuilderSearchNames(deckbuilder) {

  const name =
    typeof deckbuilder === "string"
      ? deckbuilder
      : deckbuilder?.deckbuilder_name;


  const aliases =
    typeof deckbuilder === "string"
      ? ""
      : deckbuilder?.aliases;


  return [
    name,
    ...(aliases || "").toString().split(",")
  ]
    .map(value => value.trim())
    .filter(Boolean);
}



function deckMatchesDeckbuilder(creator, deckbuilder) {

  const targets = new Set(
    getDeckbuilderSearchNames(deckbuilder)
      .map(comparableName)
      .filter(Boolean)
  );


  if (targets.size === 0) {
    return false;
  }


  const extracted = extractDeckbuilderNames(creator);



  return extracted.some(name =>
    targets.has(comparableName(name))
  );
}



function resolveDeckbuilderNamesFromRows(deckbuilderRows, creator) {

  const credits = extractDeckbuilderNames(creator);

  if (credits.length === 0) {
    return [];
  }


  return (deckbuilderRows || [])
    .filter(row =>
      credits.some(credit =>
        deckMatchesDeckbuilder(
          `Created By ${credit}`,
          row
        )
      )
    )
    .map(row => row.deckbuilder_name);
}



async function resolveDeckbuilderNames(db, creator) {

  if (!db) return [];


  const [rows] = await db.query(
    "SELECT deckbuilder_name, aliases FROM deckbuilders"
  );


  return resolveDeckbuilderNamesFromRows(rows, creator);
}



module.exports = {
  deckMatchesDeckbuilder,
  extractDeckbuilderNames,
  getDeckbuilderSearchNames,
  resolveDeckbuilderNames,
  resolveDeckbuilderNamesFromRows
};