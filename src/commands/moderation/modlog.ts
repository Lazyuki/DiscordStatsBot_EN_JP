import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { getModLogForUser, getModLogForGuild } from '@database/statements';
import { infoEmbed } from '@utils/embed';
import { descriptionPaginator } from '@utils/paginate';
import { REGEX_RAW_ID } from '@utils/regex';

const modlog: BotCommand = {
  name: 'modlog',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'List mod logs. To prevent accidentally showing warning details publically, this command is only available in one of `hiddenChannels` defined in the `config` command.',
  arguments: '[@user]',
  aliases: ['ml', 'modlogs'],
  examples: ['ml', 'ml 284840842026549259'],
  normalCommand: async ({ bot, content, message, server }) => {
    if (content) {
      const userId = content.match(REGEX_RAW_ID)?.[0];
      if (!userId) {
        throw new CommandArgumentError(
          `Please specify a user by either mentioning them or using their ID`
        );
      }
      const userModLogs = getModLogForUser({
        guildId: server.guild.id,
        userId,
      });
      const banned = await server.guild.bans.fetch(userId);

      if (userModLogs.length === 0) {
        await message.channel.send(
          infoEmbed(
            `No mod log entries found${
              banned
                ? ` but was banned for:\n ${
                    banned.reason || 'Reason: Unspecified'
                  }`
                : ''
            }.`
          )
        );
      } else {
        await descriptionPaginator(
          message.channel,
          'Mod Logs for ',
          userModLogs.map((ml) => `${ml.userId}: ${ml.content}`),
          15,
          ''
        );
      }
    } else {
      // Paginated warn logs
      const allModLogs = getModLogForGuild({ guildId: server.guild.id });
      await descriptionPaginator(
        message.channel,
        'Mod Logs',
        allModLogs.map((ml) => `${ml.userId}: ${ml.count}`),
        15,
        ''
      );
    }
  },
};

export default modlog;
