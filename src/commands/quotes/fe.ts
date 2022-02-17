import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { EJLX, FE_COLOR } from '@utils/constants';
import { makeEmbed } from '@utils/embed';

let lastCalled = 0;

const command: BotCommand = {
  allowedServers: [EJLX],
  description: 'Explanation of the FE (Fluent English) role',
  normalCommand: async ({ message }) => {
    const now = new Date().getTime();
    if (now - lastCalled < 10_000) {
      message.delete();
      return;
    } // 10 sec cooldown
    lastCalled = now;

    await message.channel.send(
      makeEmbed({
        color: FE_COLOR,
        description: stripIndents`
          People with the 'Fluent' tag must set a good example for English learners. \
          If we see you speak accurately and actively in English, you will receive the tag (may take a while).
          `,
      })
    );
    await message.delete();
  },
};

export default command;
