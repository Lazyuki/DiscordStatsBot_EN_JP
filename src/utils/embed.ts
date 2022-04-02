import { ColorResolvable, Message, MessageEmbed, Util } from 'discord.js';
import {
  EMBED_BG_COLOR,
  ERROR_COLOR,
  INFO_COLOR,
  SUCCESS_COLOR,
  WARNING_COLOR,
} from './constants';
import { splitMessage } from './safeSend';

export interface EmbedField {
  name: string; // Max 256
  value: string; // Max 1024
  inline?: boolean;
}

// Total embed characters limit 6000
interface EmbedOptions {
  content?: string; // Message content outside of Embeds
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
  baseEmbed?: MessageEmbed
) => {
  const embed = baseEmbed || new MessageEmbed().setColor(color);
  const additionalEmbeds: MessageEmbed[] = [];
  if (title) embed.setTitle(title);
  if (titleUrl) embed.setURL(titleUrl);
  if (description) {
    if (description.length > 4096) {
      const [firstChunk, ...restChunk] = splitMessage(description, 4096);
      embed.setDescription(firstChunk);
      restChunk.forEach((chunk) => {
        const extraEmbed = new MessageEmbed()
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
    embed.addFields(...(fields.filter(Boolean) as EmbedField[]));

  return { content, embeds: [embed, ...additionalEmbeds] };
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
  if (typeof options === 'string') {
    return makeEmbed({ description: options, color: 'PURPLE' });
  }
  return makeEmbed({
    ...options,
    color: 'PURPLE',
  });
};

export async function editEmbed(message: Message, newOptions: EmbedOptions) {
  const currentEmbed = message.embeds[0];
  if (!currentEmbed) return;

  await message.edit(makeEmbed(newOptions, currentEmbed));
}
