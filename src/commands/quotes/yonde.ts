import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'yonde',
  allowedServers: [EJLX],
  description:
    'Readme message for new users in Japanese. Use `,readme` for English.',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    const mentioned = message.mentions.members?.first();
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: 'LUMINOUS_VIVID_PINK',
        title: `${
          mentioned ? mentioned.user.username + 'さん、' : ''
        }ようこそ！！ 🎉 このサーバーの簡単な説明です`,
        mainImage: 'https://i.imgur.com/2N1fJH2.png',
        fields: [
          {
            name: '注意事項（必読）',
            value:
              '<#189585230972190720> で上にスクロールすると説明があります！',
            inline: true,
          },
        ],
      })
    );
  },
};

export default command;
