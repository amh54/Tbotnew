
const {
  ContainerBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

const MAX_DISPLAYABLE_TEXT = 3800;

/*
 * Discord Components V2 has a 4000-character displayable-text
 * limit for a message.
 *
 * We use 3800 as a safety margin so that formatting/other
 * component text cannot push us over the limit.
 */
function splitText(text, maxLength = MAX_DISPLAYABLE_TEXT) {
  const value = String(text || "").trim();

  if (!value) {
    return ["No information provided."];
  }

  if (value.length <= maxLength) {
    return [value];
  }

  const chunks = [];
  let remaining = value;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n\n", maxLength);

    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf("\n", maxLength);
    }

    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/*
 * Get the database rows.
 *
 * tierid = 1 is the introduction/FAQ row.
 * All other rows represent individual classes.
 */
async function getKeepOrScrapData(client) {
  const db = client.db || require("../../../index.js");

  const result = await db.query(`
    SELECT
      tierid,
      side,
      class,
      image,
      reasoning,
      creator
    FROM web_keep_or_scrap
    ORDER BY tierid ASC
  `);

  return result.rows || [];
}

/*
 * Creates the original-looking class section:
 *
 * # Guardian
 * reasoning...
 *
 * [thumbnail]
 *
 * The image comes directly from the database.
 */
function buildClassSection(row, textOverride = null) {
  const className = String(
    row?.class || "Unknown Class"
  ).trim();

  const reasoning = String(
    textOverride !== null
      ? textOverride
      : row?.reasoning || "No reasoning provided."
  ).trim();

  const text = new TextDisplayBuilder().setContent(
    `# ${className}\n${reasoning}`
  );

  const imageUrl = String(row?.image || "").trim();

  /*
   * If there is an image, use the original SectionBuilder
   * + ThumbnailBuilder appearance.
   */
  if (imageUrl) {
    try {
      const thumbnail = new ThumbnailBuilder().setURL(imageUrl);

      return new SectionBuilder()
        .addTextDisplayComponents(text)
        .setThumbnailAccessory(thumbnail);
    } catch (error) {
      console.error(
        `Invalid image URL for Keep or Scrap class "${className}":`,
        imageUrl,
        error
      );
    }
  }

  /*
   * If the database does not contain an image,
   * still display the class normally.
   */
  return text;
}

/*
 * Build the Intro.
 *
 * The intro is ONLY the introduction row.
 *
 * It does NOT include:
 * - Plants
 * - Zombies
 * - Class rows
 */
async function buildIntroContainers(client, introRow) {
  if (!introRow) {
    return [];
  }

  const containers = [];

  /*
   * Fetch creator avatar.
   */
  const creatorId =
    String(introRow?.creator || "").trim() ||
    "256910306003910658";

  const user = await client.users
    .fetch(creatorId)
    .catch(() => null);

  /*
   * Title section.
   */
  const introTitle = new TextDisplayBuilder().setContent(
    "# Keep or Scrap Created By <@256910306003910658>."
  );

  const firstContainer = new ContainerBuilder();

  if (user) {
    const authorImage = new ThumbnailBuilder().setURL(
      user.displayAvatarURL()
    );

    const authorSection = new SectionBuilder()
      .addTextDisplayComponents(introTitle)
      .setThumbnailAccessory(authorImage);

    firstContainer.addSectionComponents(authorSection);
  } else {
    firstContainer.addTextDisplayComponents(introTitle);
  }

  firstContainer.addSeparatorComponents((separator) =>
    separator.setSpacing(SeparatorSpacingSize.Large)
  );

  /*
   * The database reasoning contains the actual intro/FAQ.
   *
   * Split it into chunks so the entire Components V2
   * message stays below Discord's displayable-text limit.
   */
  const introText = String(
    introRow?.reasoning || "No introduction provided."
  ).trim();

  const introChunks = splitText(introText);

  /*
   * Try to put the first intro chunk into the first
   * container with the title.
   */
  const firstChunk = introChunks.shift();

  if (firstChunk) {
    firstContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(firstChunk)
    );
  }

  firstContainer.setAccentColor(16777215);

  containers.push(firstContainer);

  /*
   * Any remaining intro text gets its own container.
   *
   * These are STILL intro-only containers.
   */
  for (const chunk of introChunks) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(chunk)
    );

    container.setAccentColor(16777215);

    containers.push(container);
  }

  return containers;
}

/*
 * Build Plant/Zombie containers.
 *
 * Each class is kept as a SectionBuilder with its
 * thumbnail image.
 *
 * Multiple classes are packed into the same container
 * until adding another class would exceed Discord's
 * 4000-character displayable-text limit.
 */
function buildSideContainers(rows, side) {
  const normalizedSide = String(side || "")
    .trim()
    .toLowerCase();

  const sideRows = rows
    .filter((row) => {
      const rowSide = String(row?.side || "")
        .trim()
        .toLowerCase();

      if (normalizedSide === "plant") {
        return rowSide === "plant" || rowSide === "plants";
      }

      return (
        rowSide === "zombie" ||
        rowSide === "zombies"
      );
    })
    .sort((a, b) => {
      const aId = Number(a?.tierid) || 0;
      const bId = Number(b?.tierid) || 0;

      return aId - bId;
    });

  if (sideRows.length === 0) {
    return [];
  }

  const containers = [];

  let currentContainer = new ContainerBuilder();
  let currentTextLength = 0;
  let classesInCurrentContainer = 0;

  /*
   * Plant = green
   * Zombie = gray
   */
  const accentColor =
    normalizedSide === "plant"
      ? 65280
      : 10494192;

  /*
   * Add the side title to the first container.
   */
  const sideTitle = new TextDisplayBuilder().setContent(
    `# ${
      normalizedSide === "plant"
        ? "Plants"
        : "Zombies"
    }`
  );

  currentContainer.addTextDisplayComponents(sideTitle);

  /*
   * Account for the title in the displayable text count.
   */
  currentTextLength =
    sideTitle.data?.content?.length || 0;

  for (const row of sideRows) {
    const className = String(
      row?.class || "Unknown Class"
    ).trim();

    const reasoning = String(
      row?.reasoning || "No reasoning provided."
    ).trim();

    const classText = `# ${className}\n${reasoning}`;

    /*
     * If a single class itself is larger than the limit,
     * split its reasoning.
     *
     * The first chunk gets the image.
     * Additional chunks are plain TextDisplays.
     */
    const classChunks = splitText(
      classText,
      MAX_DISPLAYABLE_TEXT
    );

    /*
     * If the class fits as a single section, try to
     * add it to the current container.
     */
    if (classChunks.length === 1) {
      const separatorLength = 2;

      const projectedLength =
        currentTextLength +
        separatorLength +
        classChunks[0].length;

      if (
        classesInCurrentContainer > 0 &&
        projectedLength > MAX_DISPLAYABLE_TEXT
      ) {
        currentContainer.setAccentColor(accentColor);
        containers.push(currentContainer);

        currentContainer = new ContainerBuilder();

        currentTextLength = 0;
        classesInCurrentContainer = 0;
      }

      /*
       * Add separator before every class except
       * the first class in the container.
       */
      if (classesInCurrentContainer > 0) {
        currentContainer.addSeparatorComponents(
          (separator) =>
            separator.setSpacing(
              SeparatorSpacingSize.Large
            )
        );

        currentTextLength += 2;
      }

      const section = buildClassSection(row);

      /*
       * SectionBuilder contains the class TextDisplay
       * plus the image accessory.
       */
      currentContainer.addSectionComponents(section);

      currentTextLength +=
        classChunks[0].length;

      classesInCurrentContainer++;

      continue;
    }

    /*
     * A class has very long reasoning.
     *
     * Finish the current container first if it already
     * contains classes.
     */
    if (classesInCurrentContainer > 0) {
      currentContainer.setAccentColor(accentColor);
      containers.push(currentContainer);

      currentContainer = new ContainerBuilder();

      currentTextLength = 0;
      classesInCurrentContainer = 0;
    }

    /*
     * First chunk gets the class image.
     */
    const firstSection = buildClassSection(
      row,
      classChunks[0]
    );

    currentContainer.addSectionComponents(
      firstSection
    );

    currentTextLength =
      classChunks[0].length;

    classesInCurrentContainer++;

    /*
     * Remaining chunks are added as text displays.
     */
    for (let i = 1; i < classChunks.length; i++) {
      const chunk = classChunks[i];

      /*
       * If this chunk will not fit, finish the current
       * container and continue in a new one.
       */
      if (
        currentTextLength +
          2 +
          chunk.length >
        MAX_DISPLAYABLE_TEXT
      ) {
        currentContainer.setAccentColor(
          accentColor
        );

        containers.push(currentContainer);

        currentContainer =
          new ContainerBuilder();

        currentTextLength = 0;
        classesInCurrentContainer = 0;
      }

      if (currentTextLength > 0) {
        currentContainer.addSeparatorComponents(
          (separator) =>
            separator.setSpacing(
              SeparatorSpacingSize.Large
            )
        );

        currentTextLength += 2;
      }

      currentContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(chunk)
      );

      currentTextLength += chunk.length;
    }
  }

  /*
   * Push the final container.
   */
  if (classesInCurrentContainer > 0) {
    currentContainer.setAccentColor(accentColor);
    containers.push(currentContainer);
  }

  return containers;
}

/*
 * Main builder.
 *
 * IMPORTANT:
 *
 * This returns separate groups:
 *
 * introContainers
 * plantContainers
 * zombieContainers
 *
 * The slash command decides which group to send.
 *
 * Therefore selecting "intro" can NEVER send the
 * Plants or Zombies containers.
 */
async function buildKeepOrScrapContainers(client) {
  const rows = await getKeepOrScrapData(client);

  /*
   * tierid = 1 is the introduction row.
   */
  const introRow = rows.find(
    (row) => Number(row?.tierid) === 1
  );

  /*
   * Everything except tierid 1 is a class row.
   */
  const classRows = rows.filter(
    (row) => Number(row?.tierid) !== 1
  );

  const introContainers =
    await buildIntroContainers(
      client,
      introRow
    );

  const plantContainers =
    buildSideContainers(
      classRows,
      "plant"
    );

  const zombieContainers =
    buildSideContainers(
      classRows,
      "zombie"
    );

  console.log(
    `Keep or Scrap generated:
  Intro: ${introContainers.length} container(s)
  Plants: ${plantContainers.length} container(s)
  Zombies: ${zombieContainers.length} container(s)`
  );

  return {
    introContainers,
    plantContainers,
    zombieContainers,

    /*
     * Backwards-compatible single-container properties.
     *
     * These are useful if another command still expects
     * introContainer / plantContainer / zombieContainer.
     */
    introContainer:
      introContainers[0] || null,

    plantContainer:
      plantContainers[0] || null,

    zombieContainer:
      zombieContainers[0] || null,
  };
}

module.exports = {
  name: "keeporscrap",
  aliases: ["kos"],
  category: "Miscellaneous",

  buildKeepOrScrapContainers,
  buildIntroContainers,
  buildSideContainers,
  getKeepOrScrapData,

  /*
   * Legacy prefix-command support.
   *
   * This sends the complete guide, just like the
   * original command did.
   */
  run: async (client, message) => {
    const {
      introContainers,
      plantContainers,
      zombieContainers,
    } =
      await buildKeepOrScrapContainers(client);

    const allContainers = [
      ...introContainers,
      ...plantContainers,
      ...zombieContainers,
    ];

    for (const container of allContainers) {
      await message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
          parse: [],
        },
      });
    }
  },
};
