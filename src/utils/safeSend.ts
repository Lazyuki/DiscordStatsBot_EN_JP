import { Message, MessageOptions } from 'discord.js';
import { codeBlock } from './formatString';

function splitAndAppend(chunk: string, delimiter: string) {
  const split = chunk.split(delimiter);
  if (split.length > 1) {
    const withDelim = split.map((s) => s + delimiter);
    if (chunk.endsWith(delimiter)) {
      withDelim[withDelim.length - 1] += delimiter;
    }
    return withDelim;
  } else {
    return split;
  }
}

function splitString(
  text: string,
  {
    maxLength = 2_000,
    char = '\n',
    prepend = '',
    append = '',
  }: {
    maxLength?: number;
    char?: string | string[];
    prepend?: string;
    append?: string;
  } = {}
): string[] {
  if (text.length <= maxLength) return [text];
  let splitText = [text];
  if (Array.isArray(char)) {
    if (!char.includes('')) {
      char.push('');
    }
    while (
      char.length > 0 &&
      splitText.some((elem) => elem.length > maxLength - 1) // 1 for newline at the end
    ) {
      const currentChar = char.shift()!;
      splitText = splitText.flatMap((chunk) =>
        splitAndAppend(chunk, currentChar)
      );
    }
  } else {
    splitText = text.split(char);
  }
  if (splitText.some((elem) => elem.length > maxLength))
    throw new RangeError('SPLIT_MAX_LEN');
  const messages = [];
  let msg = '';
  for (const chunk of splitText) {
    if (msg && (msg + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }
    msg += (msg && msg !== prepend ? prepend : '') + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}

export function splitMessage(content: string, maxLength = 2_000) {
  let isCodeBlock = false;
  let codeBlockLang = '';
  if (content.startsWith('```') && content.endsWith('```')) {
    isCodeBlock = true;
    codeBlockLang = content.split('\n')[0].slice(3);
    content = content.slice(4 + codeBlockLang.length, content.length - 3);
  }
  const contentArray = splitString(content, {
    maxLength: isCodeBlock ? maxLength - 8 - codeBlockLang.length : maxLength,
    append: '\n(continued)',
    char: ['\n', ' ', '。'],
  });
  if (isCodeBlock) {
    return contentArray.map((c) => codeBlock(c, codeBlockLang));
  } else {
    return contentArray;
  }
}

// Send or reply safely, even if the message length exceeds the limit
function safeSend(_send: (m: MessageOptions) => Promise<Message | undefined>) {
  return async (content: string | MessageOptions) => {
    if (typeof content === 'string') {
      if (content.length > 2000) {
        const [firstChunk, ...restChunks] = splitMessage(content);
        const createdMessage = await _send({ content: firstChunk });
        restChunks.forEach(async (chunk) => {
          await _send({ content: chunk });
        });
        return createdMessage;
      } else {
        if (!content) content = '*empty result*';
        return await _send({ content });
      }
    } else if (typeof content === 'object') {
      const messageContent = content.content;
      if (messageContent && messageContent.length > 2000) {
        const [firstChunk, ...restChunk] = splitMessage(messageContent);
        const createdMessage = await _send({
          ...content,
          content: firstChunk,
        });
        restChunk.forEach(async (chunk) => {
          await _send({ content: chunk });
        });
        return createdMessage;
      } else {
        return await _send(content);
      }
    } else {
      return await _send({ content: '*empty result*' });
    }
  };
}

export default safeSend;
