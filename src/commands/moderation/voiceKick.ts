import { BotCommand } from '@/types';

import { successEmbed } from '@utils/embed';
import { parseMembers } from '@utils/argumentParsers';
import { joinNaturally } from '@utils/formatString';
import { CommandArgumentError } from '@/errors';

const command: BotCommand = {
  name: 'voiceKick',
  aliases: ['vk'],
  isAllowed: ['MOVE_MEMBERS'],
  description: 'Kick someone from VC',
  requiredBotPermissions: ['MOVE_MEMBERS'],
  arguments: '<@user>',
  examples: ['vk @user'],
  normalCommand: async ({ message, content, server }) => {
    const { members } = parseMembers(content, server.guild);
    if (members.length) {
      for (const member of members) {
        member.voice.channel && (await member.voice.disconnect());
      }
      await message.channel.send(
        successEmbed(
          `Successfully kicked ${joinNaturally(
            members.map((m) => m.toString())
          )}`
        )
      );
      return;
    }
  },
};

export default command;
