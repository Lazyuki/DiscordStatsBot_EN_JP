import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { getActiveUserMessages } from '@database/statements';
import { AJ, EJLX, FE, FE2, FJ, HJ, NE, NJ, OL } from '@utils/constants';
import { infoEmbed } from '@utils/embed';
import { isOrAre } from '@utils/pluralize';
import { stripIndent } from 'common-tags';
import { GuildMember } from 'discord.js';

const command: BotCommand = {
  name: 'languages',
  aliases: ['lang', 'langs'],
  allowedServers: [EJLX],
  description:
    'Language role stats for the server. Use `{PREFIX}lang -all` to include everyone. `-m` and `-v` are treated as OR',
  options: [
    {
      name: 'all',
      short: 'a',
      description: 'Include all users and ignore minimum message/voice count',
      bool: true,
    },
    {
      name: 'messages',
      short: 'm',
      description:
        'Minimum number of messages to be included in the stats. Default: 100. Use `infinity` to ignore message count',
      bool: false,
    },
    {
      name: 'voice',
      short: 'v',
      description:
        'Minimum hours of VC activity to be included in the stats: Default: 5. Use `infinity` to ignore voice count.',
      bool: false,
    },
  ],
  normalCommand: async ({ message, server, options, content }) => {
    await message.channel.sendTyping();
    const all = Boolean(options['all']) || content === 'all';
    let members: GuildMember[] = [...server.guild.members.cache.values()];
    let minMessages = 100;
    let minVoiceHours = 5;
    if (!all) {
      const messages = options['messages'] as string;
      const voice = options['voice'] as string;
      if (messages === 'infinity') {
        minMessages = 9999999999;
      } else if (messages) {
        minMessages = parseInt(messages);
        if (isNaN(minMessages)) {
          throw new CommandArgumentError(
            'Please provide an integer for the number of messages'
          );
        }
      }
      if (voice === 'infinity') {
        minVoiceHours = 9999999;
      } else if (voice) {
        minVoiceHours = parseInt(voice);
        if (isNaN(minVoiceHours)) {
          throw new CommandArgumentError(
            'Please provide an integer for the number of hours'
          );
        }
      }
      const minVoiceSeconds = minVoiceHours * 60 * 60;
      const userMessages = getActiveUserMessages({
        guildId: server.guild.id,
        threshold: minMessages,
      });
      const userVoice = getActiveUserMessages({
        guildId: server.guild.id,
        threshold: minVoiceSeconds,
      });
      const userIds = [
        ...new Set([
          ...userMessages.map((u) => u.userId),
          ...userVoice.map((u) => u.userId),
        ]),
      ];
      members = members.filter((m) => userIds.includes(m.id));
    }

    const count = (n: number) => `**${n}** ${isOrAre(n)}`;
    const langs: Record<string, number> = {
      [NJ]: 0,
      [NE]: 0,
      [FE]: 0,
      [HJ]: 0,
      [AJ]: 0,
      [FJ]: 0,
      [OL]: 0,
      [NJ + NE]: 0,
      [NJ + FE]: 0,
      [NJ + OL]: 0,
      [NE + OL]: 0,
      [FJ + NE]: 0,
      [FJ + FE]: 0,
    };
    for (const member of members) {
      const roles = member.roles.cache;
      if (roles.has(NJ)) langs[NJ]++;
      if (roles.has(NE)) langs[NE]++;
      if (roles.hasAny(FE, FE2)) langs[FE]++;
      if (roles.has(FJ)) langs[FJ]++;
      if (roles.has(AJ)) langs[AJ]++;
      if (roles.has(HJ)) langs[HJ]++;
      if (roles.has(OL)) langs[OL]++;
      if (roles.hasAll(NJ, NE)) langs[NJ + NE]++;
      if (roles.has(NJ) && roles.hasAny(FE, FE2)) langs[NJ + FE]++;
      if (roles.hasAll(NJ, OL)) langs[NJ + OL]++;
      if (roles.hasAll(NE, OL)) langs[NE + OL]++;
      if (roles.hasAny(FJ, AJ) && roles.has(NE)) langs[FJ + NE]++;
      if (roles.hasAny(FJ, AJ) && roles.hasAny(FE, FE2)) langs[FJ + FE]++;
    }
    await message.channel.send(
      infoEmbed({
        title: `Language Role Stats`,
        description: stripIndent`
          Out of **${members.length}** people${
          all
            ? ''
            : ` who have sent more than ${minMessages} messages or spent more than ${minVoiceHours} hours in the past 30 days`
        },
          ${count(langs[NJ])} <@&${NJ}>
          ${count(langs[FJ])} <@&${FJ}>
          ${count(langs[AJ])} <@&${AJ}>
          ${count(langs[HJ])} <@&${HJ}>
          ${count(langs[NE])} <@&${NE}>
          ${count(langs[FE])} <@&${FE}>
          ${count(langs[OL])} <@&${OL}>

          ${count(langs[NJ + NE])} NJ and NE
          ${count(langs[NJ + FE])} NJ and FE
          ${count(langs[NJ + OL])} NJ and OL
          ${count(langs[NE + OL])} NE and OL
          ${count(langs[FJ + NE])} FJ/AJ and NE
          ${count(langs[FJ + FE])} FJ/AJ and FE
          `,
      })
    );
  },
};

export default command;
