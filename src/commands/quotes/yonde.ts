import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { makeEmbed } from '@utils/embed';

let lastCalled = 0;

const command: BotCommand = {
  allowedServers: [EJLX],
  description:
    'Readme message for new users in Japanese. Use `,readme` for English.',
  normalCommand: async ({ message }) => {
    const now = new Date().getTime();
    // 10 seconds cooldown
    if (now - lastCalled < 10_000) {
      message.delete();
      return;
    }
    lastCalled = now;

    const mentioned = message.mentions.members?.first();
    await message.delete();
    await message.channel.send(
      makeEmbed({
        color: 'LUMINOUS_VIVID_PINK',
        title: `${
          mentioned ? mentioned.user.username + 'さん、' : ''
        }ようこそ！！ 🎉 このサーバーの簡単な説明です`,
        mainImage: 'https://i.imgur.com/NmUudeF.png',
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
