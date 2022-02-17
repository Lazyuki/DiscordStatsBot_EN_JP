import { Message, MessageOptions, MessagePayload, Util } from 'discord.js';

function splitMessages(content: string) {
  return Util.splitMessage(content, {
    maxLength: 2000,
    append: '\n(continued)',
    char: ['\n', ' ', '。'],
  });
}

// Send or reply safely, even if the message length exceeds the limit
function safeSend(_send: (m: MessageOptions) => Promise<Message | undefined>) {
  return async (content: string | MessageOptions) => {
    if (typeof content === 'string') {
      if (content.length > 2000) {
        const [firstChunk, ...restChunks] = splitMessages(content);
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
        const [firstChunk, ...restChunk] = splitMessages(messageContent);
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
