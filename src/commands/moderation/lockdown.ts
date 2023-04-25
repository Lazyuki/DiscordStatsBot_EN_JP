import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { EJLX, JHO, RAI } from '@utils/constants';
import { DAY_IN_MILLIS, getDiscordTimestamp } from '@utils/datetime';
import { errorEmbed, successEmbed } from '@utils/embed';
import { getTextChannel } from '@utils/guildUtils';
import { REGEX_RAW_ID } from '@utils/regex';
import { SnowflakeUtil, TextChannel } from 'discord.js';

declare module '@/types' {
  interface ServerData {
    lockdown: QuickBanConfig | undefined;
  }
}

const command: BotCommand = {
  name: 'lockdown',
  isAllowed: ['ADMIN'],
  allowedServers: [EJLX],
  requiredBotPermissions: ['BanMembers'],
  description:
    'Set up "lockdown". All new users will be muted and welcome bots will not work. Leave blank to unset. Lockdown allows Ciri to open up a reaction ban menu for new users that match the criteria. The quickban menu allows WPs and up to ban new users with reactions.',
  options: [
    {
      name: 'time',
      short: 't',
      description:
        'Discord ID to check whether or not the user account is created after the specified ID',
      bool: false,
    },
    {
      name: 'link',
      short: 'l',
      description:
        'User joined through this invite link. Use raw invite links like "japanese" or "VMNnyEk"',
      bool: false,
    },
    {
      name: 'regex',
      short: 'r',
      description: 'Javascript regex to check against the username',
      bool: false,
    },
    {
      name: 'ignore',
      short: 'i',
      description: 'Whether the regex provided should ignore case',
      bool: true,
    },
  ],
  examples: ['quickban -t 646129675202199582 -l japanese -r ^bannable_name -i'],
  normalCommand: async ({ options, server, message }) => {
    const currentLockdown = server.data.lockdown;
    const timeId = (options['time'] as string) || '';
    const link = (options['link'] as string) || '';
    const regexStr = (options['regex'] as string) || '';
    const ignoreCase = Boolean(options['ignore']);
    const jho = getTextChannel(server.guild, JHO);
    if (!jho || !(jho instanceof TextChannel)) return;

    if (!timeId && !link && !regexStr) {
      if (currentLockdown) {
        server.data.lockdown = undefined;
        try {
          await jho.permissionOverwrites.delete(RAI);
        } catch (e) {
          await message.channel.send(
            errorEmbed('Failed to delete permission overwrites for Rai in JHO')
          );
        }
        await message.channel.send(successEmbed(`Lockdown has been removed.`));
        return;
      } else {
        throw new CommandArgumentError(
          'Please provide options to enable lockdown'
        );
      }
    }
    let time = new Date().getTime();
    if (timeId) {
      const id = timeId.match(REGEX_RAW_ID)?.[0];
      if (!id) {
        throw new CommandArgumentError(
          'Please provide a valid ID for the -t option'
        );
      }
      time = SnowflakeUtil.timestampFrom(id);
    }

    try {
      await jho.permissionOverwrites.create(RAI, {
        SendMessages: false,
      });
    } catch (e) {
      await message.channel.send(
        errorEmbed('Failed to overwrite permissions for Rai in JHO')
      );
    }

    server.data.lockdown = {
      time,
      link,
      regexStr,
      ignoreCase,
    };
    await message.channel.send(
      successEmbed(
        `Lockdown has been enabled and new users are muted. Rai is also muted in JHO.`
      )
    );
  },
};

export default command;
