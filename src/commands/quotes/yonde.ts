import { MessageEmbed } from 'discord.js';

import { BotCommand } from '../../types';
import { EJLX } from '../../utils/ejlxConstants';

let lastCalled = 0;

const command: BotCommand = {
  allowedServers: [EJLX],
  description:
    'Readme message for new users in Japanese. Use `,readme` for English.',
  normalCommand: (content, message) => {
    const now = new Date().getTime();
    // 10 seconds cooldown
    if (now - lastCalled < 10_000) {
      message.delete();
      return;
    }
    lastCalled = now;
    const mentioned = message.mentions.members?.first();
    const embed = new MessageEmbed()
      .setTitle(
        `${
          mentioned ? mentioned.user.username + 'さん、' : ''
        }ようこそ！！ 🎉 このサーバーの簡単な説明です`
      )
      .setImage('https://i.imgur.com/NmUudeF.png')
      .addField(
        '注意事項（必読）',
        '<#189585230972190720> で上にスクロールすると説明があります！',
        true
      )
      .setColor('LUMINOUS_VIVID_PINK');
    message.delete();
    message.channel.send({ embeds: [embed] });
  },
};

export default command;
