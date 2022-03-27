import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { safeDelete } from '@utils/safeDelete';
import { stripIndent } from 'common-tags';

const command: BotCommand = {
  name: 'emojiCredits',
  aliases: ['ec'],
  allowedServers: [EJLX],
  description: 'EJLX Emoji credits',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      stripIndent`
      We use some amazing emojis from other servers. For more emojis, check out:
      **Roo emojis**: https://discord.com/invite/nNXn2FC
      **Potato emojis**: https://discord.gg/tato
      **Blob emojis**: https://blobs.gg/
      `
    );
  },
};

export default command;
