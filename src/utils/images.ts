import logger from '@/logger';
import { GuildMessage } from '@/types';
import axios from 'axios';
import { Message, MessageAttachment, TextBasedChannel } from 'discord.js';
import fs from 'fs';
import { getStartHourISO } from './datetime';
import { pluralCount, pluralize } from './pluralize';

const MAX_BYTES = 50_000_000; // 50MB

function safeCreateDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getImageFilePath(fileName: string) {
  const startHour = getStartHourISO();
  safeCreateDir('./.temp_images');
  return `./.temp_images/${startHour}__${fileName}`;
}

export async function downloadMessageAttachments(
  message: Message
): Promise<string[] | null> {
  if (message.attachments.size === 0) return null;
  const attachments = message.attachments.values();
  const filePaths: string[] = [];
  for (const attachment of attachments) {
    if (attachment.size > MAX_BYTES) {
      logger.warning(
        `Attachment exceeds the limit at ${attachment.size} bytes. Guild: ${
          message.guild?.name
        } | Channel: ${(message.channel as any).name} | Author: ${
          message.author.tag
        } | Type: ${attachment.contentType}`
      );

      continue;
    }
    const contentType = attachment.contentType;
    const isImage = contentType?.includes('image');
    const isVideo = contentType?.includes('video');
    if (isImage || isVideo) {
      // image
      const format = contentType?.split('/')[1];
      try {
        const res = await axios.get(attachment.proxyURL);
        if (res.data) {
          const filePath = getImageFilePath(
            attachment.name || `${attachment.id}.${format}`
          );
          fs.writeFileSync(filePath, res.data);
          filePaths.push(filePath);
        }
      } catch {}
    }
  }
  if (filePaths.length === 0) return null;
  return filePaths;
}

export async function proxyPostAttachments(
  message: Message,
  channel: TextBasedChannel
) {
  if (message.attachments.size === 0) return 0;
  const attachments = message.attachments.values();
  const proxyAttachments: MessageAttachment[] = [];
  for (const attachment of attachments) {
    if (attachment.size > MAX_BYTES) {
      // Since discord.js will download the attachment even if you are just proxying it, make sure not to download huge files
      logger.warning(
        `Proxy Attachment exceeds the limit at ${
          attachment.size
        } bytes. Guild: ${message.guild?.name} | Channel: ${
          (message.channel as any).name
        } | Author: ${message.author.tag} | Type: ${attachment.contentType}`
      );
      continue;
    }
    const contentType = attachment.contentType;
    const isImage = contentType?.includes('image');
    const isVideo = contentType?.includes('video');
    if (isImage || isVideo) {
      const format = contentType?.split('/')[1];
      const proxyAttachment = new MessageAttachment(
        attachment.proxyURL,
        attachment.name || `${attachment.id}.${format}`
      ).setSpoiler(true);
      proxyAttachments.push(proxyAttachment);
    }
  }
  if (proxyAttachments.length) {
    await channel.send({
      content: `${pluralize(
        'File',
        's',
        proxyPostAttachments.length
      )} from message:${message.id} by ${message.author.tag} in <#${
        message.channel.id
      }>`,
      files: proxyAttachments,
    });
    return proxyAttachments.length;
  }
  return 0;
}
