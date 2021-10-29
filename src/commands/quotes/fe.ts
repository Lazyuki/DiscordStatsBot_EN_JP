import { MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';

import { BotCommand } from '../../types';
import { EJLX } from '../../utils/ejlxConstants';

let lastCalled = 0;

const command: BotCommand = {
  allowedServers: [EJLX],
  description: 'Explanation of the FE (Fluent English) role',
  normalCommand: async (content, message) => {
    const now = new Date().getTime();
    if (now - lastCalled < 10_000) {
      message.delete();
      return;
    } // 10 sec cooldown
    lastCalled = now;
    const embed = new MessageEmbed()
      .setDescription(
        stripIndents`
    People with the 'Fluent' tag must set a good example for English learners. \
    If we see you speak accurately and actively in English, you will receive the tag (may take a while).
    `
      )
      .setColor('#3995ff');
    message.channel.send({ embeds: [embed] });
    message.delete();
  },
};

export default command;
