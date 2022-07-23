import logger from '@/logger';
import { GuildMessage } from '@/types';
import axios from 'axios';
import { AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { DAY_IN_MILLIS } from './datetime';
import sharp from 'sharp';
import rimraf from 'rimraf';

export const MAX_BYTES = 50_000_000; // 50MB
export const MAX_IMAGE_HEIGHT = 800; // px
export const MAX_IMAGE_WIDTH = 800; // px
export const MAX_ATTACHMENT_STORAGE_DAYS = 1;
const TEMP_DIR = './.temp_attachments';

function safeCreateDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getImageFilePath(messageId: string, fileName: string) {
  safeCreateDir(`${TEMP_DIR}/${messageId}`);
  return `${TEMP_DIR}/${messageId}/${fileName}`;
}

export async function downloadMessageAttachments(
  message: GuildMessage
): Promise<string[] | null> {
  if (message.attachments.size === 0) return null;
  const attachments = message.attachments.values();
  const filePaths: string[] = [];
  for (const attachment of attachments) {
    if (attachment.size > MAX_BYTES) {
      const warnMessage = `Attachment exceeds the limit at ${attachment.size} bytes. Guild: ${message.guild.name} | Channel: #${message.channel.name} | Author: ${message.author.tag} | Type: ${attachment.contentType}`;
      logger.warning(warnMessage);
      continue;
    }
    const contentType = attachment.contentType;
    const isImage = contentType?.includes('image');
    const isVideo = contentType?.includes('video'); // save videos too?
    if (isImage) {
      // image
      const format = contentType?.split('/')[1];
      const originalHeight = attachment.height || 0;
      const originalWidth = attachment.width || 0;
      try {
        const res = await axios.get(attachment.proxyURL, {
          responseType: 'arraybuffer',
        });
        if (res.data) {
          let data = Buffer.from(res.data, 'binary');
          if (
            originalWidth > MAX_IMAGE_WIDTH ||
            originalHeight > MAX_IMAGE_HEIGHT
          ) {
            data = await sharp(data)
              .resize({
                width: MAX_IMAGE_WIDTH,
                height: MAX_IMAGE_HEIGHT,
                fit: 'contain',
              })
              .toBuffer();
          }
          const filePath = getImageFilePath(
            message.id,
            `${attachment.id}.${attachment.name || format}`
          );
          fs.writeFileSync(filePath, data);
          filePaths.push(filePath);
        }
      } catch (e) {
        const err = e as Error;
        logger.error(
          `Error during downloading attachment ${err.name}: ${err.message}`
        );
      }
    }
  }
  if (filePaths.length === 0) return null;
  return filePaths;
}

export async function cleanOldAttachmentFiles() {
  safeCreateDir(TEMP_DIR);
  const dirs = fs.readdirSync(TEMP_DIR);
  dirs.forEach((dirName) => {
    const fullFileName = path.join(TEMP_DIR, dirName);
    const file = fs.statSync(fullFileName);
    const now = new Date().getTime();
    const fileCreatedAt = new Date(file.ctime).getTime();
    if (now > fileCreatedAt + MAX_ATTACHMENT_STORAGE_DAYS * DAY_IN_MILLIS) {
      rimraf(fullFileName, () => {});
    }
  });
}

export function getDeletedAttachments(messageId: string): AttachmentBuilder[] {
  const dir = `${TEMP_DIR}/${messageId}`;
  if (!fs.existsSync(dir)) {
    return []; // no files
  }
  const files: AttachmentBuilder[] = [];
  const fileNames = fs.readdirSync(dir);
  fileNames.forEach((fileName) => {
    const fullFileName = `${dir}/${fileName}`;
    const file = fs.readFileSync(fullFileName);
    files.push(new AttachmentBuilder(file, { name: fileName }));
    rimraf(fullFileName, () => {}); // No longer needed
  });
  return files;
}
