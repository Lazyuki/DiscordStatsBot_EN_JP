import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { DAY_IN_MILLIS, getDiscordTimestamp } from '@utils/datetime';
import { successEmbed } from '@utils/embed';
import { REGEX_RAW_ID } from '@utils/regex';
import { SnowflakeUtil } from 'discord.js';

declare module '@/types' {
  interface ServerData {
    quickban:
      | {
          time: number;
          link: string;
          regexStr: string;
          ignoreCase: boolean;
          regex?: RegExp | {};
        }
      | undefined;
  }
}

const prune: BotCommand = {
  name: 'quickban',
  isAllowed: ['BAN_MEMBERS'],
  allowedServers: [EJLX],
  requiredBotPermissions: ['BAN_MEMBERS'],
  description:
    'Set up "quickban" with options. Leave blank to unset. Quickban allows Ciri to open up a reaction ban menu for new users that match the criteria. The quickban menu allows WPs and up to ban new users with reactions.',
  arguments:
    '[-t discord_id ]  [ -l invite_link_string ] [-r username_regex ] [ -i ignore case for regex ]',
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
  onCommandInit: (server) => {
    if (server.data.quickban) {
      const qb = server.data.quickban;
      if (qb.regexStr) {
        server.data.quickban.regex = new RegExp(
          qb.regexStr,
          qb.ignoreCase ? 'i' : undefined
        );
      } else {
        qb.regex = undefined;
      }
    }
  },
  normalCommand: async ({ options, server, message }) => {
    const currentQuickBan = server.data.quickban;
    const timeId = (options['time'] as string) || '';
    const link = (options['link'] as string) || '';
    const regexStr = (options['regex'] as string) || '';
    const ignoreCase = Boolean(options['ignore']);
    if (!timeId && !link && !regexStr) {
      if (currentQuickBan) {
        server.data.quickban = undefined;
        await message.channel.send(successEmbed(`Quickban has been removed`));
        return;
      } else {
        throw new CommandArgumentError(
          'Please provide options to enable quickban'
        );
      }
    }
    let time = new Date().getTime();
    if (timeId) {
      const id = timeId.match(REGEX_RAW_ID)?.[1];
      if (!id) {
        throw new CommandArgumentError(
          'Please provide a valid ID for the -t option'
        );
      }
      time = SnowflakeUtil.deconstruct(id).date.getTime();
    }
    server.data.quickban = {
      time,
      link,
      regexStr,
      ignoreCase,
      regex: new RegExp(regexStr, ignoreCase ? 'i' : undefined),
    };
    await message.channel.send(
      successEmbed(
        `Quick ban has been set to watch for new users created after ${getDiscordTimestamp(
          new Date(time)
        )}`
      )
    );
  },
};

export default prune;
