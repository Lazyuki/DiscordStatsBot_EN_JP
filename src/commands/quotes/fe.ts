import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { EJLX, FE_COLOR } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'fe',
  allowedServers: [EJLX],
  description: 'Explanation of the FE (Fluent English) role',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: FE_COLOR,
        description: stripIndents`
          People with the 'Fluent' tag must set a good example for English learners. \
          If we see you speak accurately and actively in English, you will receive the tag (may take a while).
          `,
      })
    );
  },
};

export default command;
