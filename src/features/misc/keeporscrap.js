const {
  ContainerBuilder,
  ThumbnailBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

const MAX_DISPLAYABLE_TEXT = 3800;

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

async function getKeepOrScrapData(client) {
  const db = client.db || require("../../../index.js");

  const result = await db.query(`
    SELECT
      tierid,
      side,
      class,
      image,
      reasoning,
      faq,
      creator
    FROM web_keep_or_scrap
    ORDER BY tierid ASC
  `);

  return result.rows || [];
}

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

  return text;
}

async function buildIntroContainers(client, introRow) {
  if (!introRow) {
    return [];
  }

  const containers = [];

  const creatorId = "256910306003910658";

  const user = await client.users
    .fetch(creatorId)
    .catch(() => null);

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

  const introText = String(
    introRow?.reasoning || "No introduction provided."
  ).trim();

  const introChunks = splitText(introText);
  const firstChunk = introChunks.shift();

  if (firstChunk) {
    firstContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(firstChunk)
    );
  }

  firstContainer.setAccentColor(16777215);
  containers.push(firstContainer);

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

function buildFaqContainers(faqRows) {
  if (!faqRows.length) {
    return [];
  }

  const containers = [];

  let currentContainer = new ContainerBuilder();
  let currentTextLength = 0;
  let hasContent = false;

  currentContainer.addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# Frequently Asked Questions")
  );

  currentTextLength = "# Frequently Asked Questions".length;

  for (const row of faqRows) {
    const faqText = String(row?.faq || "").trim();

    if (!faqText) {
      continue;
    }

    const chunks = splitText(faqText);

    for (const chunk of chunks) {
      const separatorLength = hasContent ? 2 : 0;
      const projectedLength =
        currentTextLength +
        separatorLength +
        chunk.length;

      if (
        hasContent &&
        projectedLength > MAX_DISPLAYABLE_TEXT
      ) {
        currentContainer.setAccentColor(16777215);
        containers.push(currentContainer);

        currentContainer = new ContainerBuilder();
        currentTextLength = 0;
        hasContent = false;
      }

      if (hasContent) {
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
      hasContent = true;
    }
  }

  if (hasContent) {
    currentContainer.setAccentColor(16777215);
    containers.push(currentContainer);
  }

  return containers;
}

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

  const accentColor =
    normalizedSide === "plant"
      ? 65280
      : 10494192;

  const sideTitle = new TextDisplayBuilder().setContent(
    `# ${
      normalizedSide === "plant"
        ? "Plants"
        : "Zombies"
    }`
  );

  currentContainer.addTextDisplayComponents(sideTitle);

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

    const classChunks = splitText(
      classText,
      MAX_DISPLAYABLE_TEXT
    );

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

      currentContainer.addSectionComponents(section);

      currentTextLength +=
        classChunks[0].length;

      classesInCurrentContainer++;

      continue;
    }

    if (classesInCurrentContainer > 0) {
      currentContainer.setAccentColor(accentColor);

      containers.push(currentContainer);

      currentContainer = new ContainerBuilder();
      currentTextLength = 0;
      classesInCurrentContainer = 0;
    }

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

    for (let i = 1; i < classChunks.length; i++) {
      const chunk = classChunks[i];

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

  if (classesInCurrentContainer > 0) {
    currentContainer.setAccentColor(accentColor);
    containers.push(currentContainer);
  }

  return containers;
}

async function buildKeepOrScrapContainers(client) {
  const rows = await getKeepOrScrapData(client);

  const introRow = rows.find(
    (row) => Number(row?.tierid) === 1
  );

  const faqRows = rows.filter(
    (row) => String(row?.faq || "").trim()
  );

  const classRows = rows.filter(
    (row) =>
      Number(row?.tierid) !== 1 &&
      !String(row?.faq || "").trim()
  );

  const introContainers =
    await buildIntroContainers(
      client,
      introRow
    );

  const faqContainers =
    buildFaqContainers(faqRows);

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
 FAQ: ${faqContainers.length} container(s)
 Plants: ${plantContainers.length} container(s)
 Zombies: ${zombieContainers.length} container(s)`
  );

  return {
    introContainers,
    faqContainers,
    plantContainers,
    zombieContainers,

    introContainer:
      introContainers[0] || null,

    faqContainer:
      faqContainers[0] || null,

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
  buildFaqContainers,
  buildSideContainers,
  getKeepOrScrapData,

  run: async (client, message) => {
    const {
      introContainers,
      faqContainers,
      plantContainers,
      zombieContainers,
    } = await buildKeepOrScrapContainers(client);

    const allContainers = [
      ...introContainers,
      ...faqContainers,
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
