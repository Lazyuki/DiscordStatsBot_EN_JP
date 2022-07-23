import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'japaneseSlur',
  aliases: ['jap', 'japs'],
  allowedServers: [EJLX],
  description: 'Explanation of the ethnic slur, `jap`',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: 'Red',
        description: stripIndents`
        We avoid "jap" on this server due to its historical use as a racial slur. We prefer "jp", "jpn", or "Japanese". Thank you for understanding.
        ([Some picture examples](https://imgur.com/a/lPVBo2y))
        ([Read more here](https://gist.github.com/ScoreUnder/e08b37a8af3c257107fc55fc7a8fcad6))`,
      })
    );
  },
};

export default command;
