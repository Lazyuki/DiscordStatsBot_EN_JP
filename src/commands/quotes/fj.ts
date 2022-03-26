import { MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { EJLX, FJ_COLOR } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'fj',
  allowedServers: [EJLX],
  description: 'Explanation of the FJ (Fluent Japanese) role',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: FJ_COLOR,
        description: stripIndents`
          深緑(日本語が流暢)のタグを得るためには、まずは管理者かWelcoming Partyの日本人が、\
          あなたのテキストを読んで流暢だと認める必要があります。FJタグご希望の方は、\
          ボイスチャット上でも日本語が流暢であることを確認させてもらいます。
          If you don't understand this, you aren't ready yet.
          `,
      })
    );
  },
};

export default command;
