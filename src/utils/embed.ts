import { ColorResolvable, Message, EmbedBuilder } from 'discord.js';
import {
  EMBED_BG_COLOR,
  ERROR_COLOR,
  INFO_COLOR,
  SUCCESS_COLOR,
  WARNING_COLOR,
} from './constants';
import { splitMessage, splitString } from './safeSend';

export const MAX_FIELDS = 25;

export interface EmbedField {
  name: string; // Max 256
  value: string; // Max 1024
  inline?: boolean;
}

// Total embed characters limit 6000
interface EmbedOptions {
  content?: string; // Message content outside of Embeds
  ephemeral?: boolean;
  color?: ColorResolvable;
  title?: string; // Max 256
  titleUrl?: string;
  description?: string; // Max 4096
  authorName?: string; // Max 256
  authorUrl?: string;
  authorIcon?: string; // Top left
  footer?: string; // Max 2048, no markdown
  footerIcon?: string; // Bottom left
  thumbnailIcon?: string; // Top right
  mainImage?: string; // Content image in the middle
  timestamp?: boolean | Date | number;
  fields?: (EmbedField | null)[]; // Max 25
}

export const makeEmbed = (
  {
    content,
    ephemeral,
    color = EMBED_BG_COLOR,
    title,
    titleUrl,
    description,
    authorName,
    authorUrl,
    authorIcon,
    footer,
    footerIcon,
    thumbnailIcon,
    mainImage,
    timestamp,
    fields,
  }: EmbedOptions,
  baseEmbed?: EmbedBuilder
) => {
  const embed = baseEmbed || new EmbedBuilder().setColor(color);
  const additionalEmbeds: EmbedBuilder[] = [];
  if (title) embed.setTitle(title);
  if (titleUrl) embed.setURL(titleUrl);
  if (description) {
    if (description.length > 4096) {
      const [firstChunk, ...restChunk] = splitMessage(description, 4096);
      embed.setDescription(firstChunk);
      restChunk.forEach((chunk) => {
        const extraEmbed = new EmbedBuilder()
          .setColor(color)
          .setDescription(chunk);
        additionalEmbeds.push(extraEmbed);
      });
    } else {
      embed.setDescription(description);
    }
  }
  if (authorName)
    embed.setAuthor({ name: authorName, iconURL: authorIcon, url: authorUrl });
  if (footer) embed.setFooter({ text: footer, iconURL: footerIcon });
  if (thumbnailIcon) embed.setThumbnail(thumbnailIcon);
  if (mainImage) embed.setImage(mainImage);
  if (timestamp) {
    if (typeof timestamp === 'boolean') embed.setTimestamp();
    else embed.setTimestamp(new Date(timestamp));
  }
  if (fields && fields.filter(Boolean).length)
    embed.addFields(
      ...(fields
        .filter(Boolean)
        .map((f) => (f!.value ? f : { ...f, value: '\u200b' })) as EmbedField[])
    );

  return { content, embeds: [embed, ...additionalEmbeds], ephemeral };
};

export const cleanEmbed = (options: EmbedOptions | string) => {
  return makeEmbed({
    description: typeof options === 'string' ? options : options.description,
  });
};

export const successEmbed = (options: EmbedOptions | string) => {
  const description = `✅  ${
    typeof options === 'string' ? options : options.description
  }`;
  if (typeof options === 'string') {
    return makeEmbed({ description, color: SUCCESS_COLOR });
  }
  return makeEmbed({
    ...options,
    description,
    color: SUCCESS_COLOR,
  });
};

export const errorEmbed = (options: EmbedOptions | string) => {
  const description = `❌  ${
    typeof options === 'string' ? options : options.description
  }`;
  if (typeof options === 'string') {
    return makeEmbed({ description, color: ERROR_COLOR });
  }
  return makeEmbed({
    ...options,
    description,
    color: ERROR_COLOR,
  });
};

export const warningEmbed = (options: EmbedOptions | string) => {
  const description = `⚠️  ${
    typeof options === 'string' ? options : options.description
  }`;
  if (typeof options === 'string') {
    return makeEmbed({ description, color: WARNING_COLOR });
  }
  return makeEmbed({
    ...options,
    description,
    color: WARNING_COLOR,
  });
};

export const infoEmbed = (options: EmbedOptions | string) => {
  if (typeof options === 'string') {
    return makeEmbed({ description: options, color: INFO_COLOR });
  }
  return makeEmbed({
    ...options,
    color: INFO_COLOR,
  });
};

export const questionEmbed = (options: EmbedOptions | string) => {
  const description = `❓ ${
    typeof options === 'string' ? options : options.description
  }`;
  if (typeof options === 'string') {
    return makeEmbed({ description, color: 'Purple' });
  }
  return makeEmbed({
    ...options,
    description,
    color: 'Purple',
  });
};

export async function editEmbed(message: Message, newOptions: EmbedOptions) {
  const currentEmbed = message.embeds[0];
  if (!currentEmbed) return;

  await message.edit(makeEmbed(newOptions, EmbedBuilder.from(currentEmbed)));
}

// If embed fields together might exceed the 6000 char limit, use this to construct multiple messages with embeds.
export function splitIntoMultipleEmbeds(options: EmbedOptions) {
  const fields = options.fields?.filter(Boolean) as EmbedField[];
  if (fields.length) {
    const otherLength =
      (options.authorName?.length || 0) +
      (options.authorUrl?.length || 0) +
      (options.title?.length || 0) +
      (options.description?.length || 0) +
      (options.footer?.length || 0) +
      (options.footerIcon?.length || 0) +
      (options.thumbnailIcon?.length || 0);

    const pages = splitFieldsIntoPages(fields, otherLength);
    if (pages.length === 1) {
      return [makeEmbed(options)];
    } else {
      const first = makeEmbed({ ...options, fields: pages[0].fields });
      const rest = pages.slice(1).map((page) => {
        const { content, ephemeral, ...restEmbed } = options;
        return makeEmbed({ ...restEmbed, fields: page.fields });
      });
      return [first, ...rest];
    }
  } else {
    return [makeEmbed(options)];
  }
}

// Make sure fields + other strings in the embed do NOT exceed the global 6000 character limit in 1 embed.
export function splitFieldsIntoPages(
  fields: EmbedField[],
  otherLength: number
) {
  const maxFieldChars = 6000 - otherLength;
  const pages: { fields: EmbedField[] }[] = [];
  let currFields = 0;
  let currChars = 0;
  const safeFields = splitFields(fields);
  let pageBuffer: { fields: EmbedField[] } = { fields: [] };

  safeFields.forEach((field) => {
    const length = field.name.length + field.value.length;
    if (currChars + length > maxFieldChars || currFields === MAX_FIELDS) {
      pages.push(pageBuffer);
      currFields = 1;
      currChars = length;
      pageBuffer = { fields: [field] };
    } else {
      currFields++;
      currChars += length;
      pageBuffer.fields.push(field);
    }
  });
  if (pageBuffer.fields.length) {
    pages.push(pageBuffer);
  }
  return pages;
}

// Make sure all field values are under 1024 characters, otherwise split them into multiple fields.
export function splitFields(fields: EmbedField[]) {
  const safeFields: EmbedField[] = [];
  fields.forEach((field) => {
    if (field.value.length > 1024) {
      // embed value max len
      const chunks = splitString(field.value, {
        maxLength: 1024,
        char: ['\n', ' ', '。'],
      });
      chunks.forEach((chunk, index) => {
        safeFields.push({
          name: `(${index + 1}/${chunks.length}) ${field.name}`,
          value: chunk,
        });
      });
    } else {
      safeFields.push(field);
    }
  });

  return safeFields;
}
