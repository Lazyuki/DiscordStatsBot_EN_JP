import { GuildMember, Invite, TextBasedChannel, Util } from 'discord.js';

import { editEmbed, makeEmbed } from '@utils/embed';
import {
  ADMIN,
  CHAT_MUTE,
  EJLX,
  JHO,
  MEE6,
  MINIMO,
  PING_PARTY,
  RAI,
  SERVER_RULES,
  STAFF,
  WP,
} from '@utils/constants';
import {
  BotEvent,
  GuildMessage,
  MemberJoinInvites,
  QuickBanConfig,
} from '@/types';
import { stripIndents } from 'common-tags';
import { getTextChannel } from '@utils/guildUtils';
import { resolveInviteLink } from '@utils/resolveIntiteLink';
import {
  DAY_IN_MILLIS,
  millisToDuration,
  MINUTE_IN_MILLIS,
} from '@utils/datetime';
import Server from '@classes/Server';
import { userToTagAndId } from '@utils/formatString';
import { waitForButton } from '@utils/asyncCollector';

const event: BotEvent<'guildMemberAdd'> = {
  eventName: 'guildMemberAdd',
  skipOnDebug: true,
  processEvent: async (bot, member) => {
    const server = bot.servers[member.guild.id];
    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return; // No need to log
    const invites = await resolveInviteLink(server);

    server.temp.newUsers.unshift({
      id: member.id,
      joinMillis: member.joinedTimestamp || new Date().getTime(),
      invites,
    });
    if (server.temp.newUsers.length > 50) {
      server.temp.newUsers.pop();
    }

    // EJLX has special routines
    if (member.guild.id === EJLX) {
      // Check quickbans
      if (server.data.lockdown) {
        await member.roles.add(CHAT_MUTE);
        await handleQuickban(
          member,
          invites,
          server.data.lockdown,
          server,
          true
        );
        return;
      } else if (server.data.quickban) {
        await handleQuickban(
          member,
          invites,
          server.data.quickban,
          server,
          false
        );
        return;
      }

      // No quickbans
      if (member.guild.members.cache.get(RAI)?.presence?.status === 'offline') {
        await notifyUserJoin(member, userLogChannel);
      } else {
        setTimeout(async () => {
          const messages = await userLogChannel.messages.fetch({ limit: 20 });
          for (const [, msg] of messages) {
            if (
              msg.author.id === RAI &&
              msg.embeds.length &&
              msg.embeds[0].description?.includes(member.id)
            )
              // Rai was working
              return;
          }
          await notifyUserJoin(member, userLogChannel);
        }, 5000);
      }
      const jho = getTextChannel(server.guild, JHO);
      if (!jho) return;
      if (
        member.guild.members.cache.get(MEE6)?.presence?.status === 'offline'
      ) {
        await welcomeToEJLX(member, jho);
      } else {
        setTimeout(async () => {
          const messages = await jho.messages.fetch({ limit: 30 });
          for (const [, msg] of messages) {
            if (msg.author.id === MEE6 && msg.content.includes(member.id)) {
              // Mee6 welcomed them
              return;
            }
          }
          await welcomeToEJLX(member, jho);
        }, 5000);
      }
    } else {
      // If not EJLX but has user join notification enabled
      await notifyUserJoin(member, userLogChannel);
    }
  },
};

async function notifyUserJoin(
  member: GuildMember,
  channel: TextBasedChannel,
  invite?: Invite
) {
  await channel.send(
    makeEmbed({
      color: '#84a332',
      description: `📥 **${Util.escapeMarkdown(
        member.user.tag
      )}** has \`joined\` the server. (${member.id})`,
      footer: `User Join (Members: ${member.guild.memberCount})${
        invite
          ? `\nInvite: ${invite.code} from ${
              invite.inviter?.username || 'vanity URL'
            }`
          : ''
      }`,
      footerIcon: member.user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

async function welcomeToEJLX(member: GuildMember, channel: TextBasedChannel) {
  await channel.send(
    stripIndents`
    Welcome ${member}. Please read <#${SERVER_RULES}> and tell us what your native language is!\n
    ${member}、ようこそ! あなたの母語を教えてください! 注意事項は<#${SERVER_RULES}>に書いてあります。 <@&${PING_PARTY}>
    `
  );
}

async function handleQuickban(
  member: GuildMember,
  invites: MemberJoinInvites,
  quickbanConfig: QuickBanConfig,
  server: Server,
  isLockdown: boolean
) {
  const userLogChannel = getTextChannel(
    server.guild,
    server.config.userLogChannel
  );
  if (!userLogChannel) return;
  const inviteCodes = invites.map((i) => i.code);

  let likelihood = 0;
  let maxLikelihood = 0;
  const accountCreated = member.user.createdAt;
  const accountCreateDiffSinceQuickban =
    quickbanConfig.time - accountCreated.getTime(); // if negative, account after quickban
  const accountCreateDiffNow = new Date().getTime() - accountCreated.getTime();

  const regex = quickbanConfig.regexStr
    ? new RegExp(
        quickbanConfig.regexStr,
        quickbanConfig.ignoreCase ? 'i' : undefined
      )
    : null;

  let accountAgeStr = `Account created **${millisToDuration(
    accountCreateDiffNow
  )}** ago${
    accountCreateDiffSinceQuickban < 0
      ? ` and **${millisToDuration(
          -accountCreateDiffSinceQuickban
        )}** after the quickban specified time\n`
      : '\n'
  }`;
  let linkStr = '';
  let regexStr = '';

  // Check account creation date;
  maxLikelihood += 3;
  if (accountCreateDiffNow < 10 * MINUTE_IN_MILLIS) {
    likelihood += 3;
  } else if (accountCreateDiffNow < DAY_IN_MILLIS) {
    // less than a day old
    likelihood += 2;
  }

  // Account created after the lockdown
  maxLikelihood += 2;
  if (accountCreateDiffSinceQuickban < 0) {
    likelihood += 2;
  }
  if (quickbanConfig.link) {
    maxLikelihood += 3;
    if (inviteCodes.includes(quickbanConfig.link)) {
      likelihood += 3; // same link
      linkStr = `Used the link specified: \`${quickbanConfig.link}\`\n`; // Add link invitee?
    }
  }

  // Check username regex
  if (regex) {
    maxLikelihood += 5;
    if (regex.test(member.user.username)) {
      const match = member.user.username.match(regex);
      likelihood += 5; // regex name
      regexStr = `Username matched the regex specified: \`${quickbanConfig.regexStr}\` => \`${match?.[0]}\`\n`;
    }
  }

  maxLikelihood += 2;
  if (member.user.avatar) {
    if (accountCreateDiffNow < 10 * MINUTE_IN_MILLIS) {
      // New user and already avatar
      likelihood += 2;
    } else if (accountCreateDiffNow < DAY_IN_MILLIS) {
      likelihood += 1;
    }
  }

  const suspiciousLevelStr = `Suspicious Level: ${(
    (100 * likelihood) /
    maxLikelihood
  ).toFixed(1)}% (${likelihood}/${maxLikelihood})\n`;
  const nonSuspicious = likelihood <= 1 || likelihood / maxLikelihood <= 0.2;

  if (nonSuspicious) {
    if (isLockdown) {
      await member.roles.remove(CHAT_MUTE);
      const jho = getTextChannel(server.guild, JHO);
      if (!jho) return;
      await welcomeToEJLX(member, jho);
    }
  }

  const banMenu = await userLogChannel.send(
    makeEmbed({
      color: 'RED',
      title: `New User Quickban Menu`,
      description: `**${
        member.user.username
      }** has \`joined\`. (${member})\n\n${accountAgeStr}${regexStr}${linkStr}${suspiciousLevelStr}\n\n${
        nonSuspicious
          ? isLockdown
            ? 'Automatically unmuted them since they are below the minimum threshold'
            : 'Not banning them since they are below the minimum threshold'
          : `Mods and **WP** can BAN or dismiss if you think this user is not suspicious.`
      }`,
      footer: `User Join (${member.guild.memberCount})\nLink: ${invites
        .map(
          (i) =>
            `${i.code}${i.inviter === 'vanity' ? '' : ` from ${i.inviter}`}`
        )
        .join(',')}`,
    })
  );

  if (!nonSuspicious) {
    const [response, responder] = await waitForButton(
      banMenu as GuildMessage,
      (option) => {
        const mem = server.guild.members.cache.get(option.user.id);
        if (mem) {
          return mem.roles.cache.hasAny(ADMIN, STAFF, MINIMO, WP);
        }
        return false;
      },
      [
        { id: 'BAN', label: 'BAN', style: 'DANGER' },
        { id: 'DISMISS', label: 'Dismiss', style: 'SECONDARY' },
      ],
      5 * 60 // 5 minutes
    );
    switch (response) {
      case 'BAN':
        await member.ban({
          days: 1,
          reason: `Banned by ${userToTagAndId(responder!)} Reason: ${
            isLockdown ? 'lockdown' : 'quickban'
          }`,
        });
        await editEmbed(banMenu, {
          footer: `Banned by ${responder!.tag}`,
        });
        return;
      case 'DISMISS':
      case 'TIMEOUT':
        if (isLockdown) {
          await member.roles.remove(CHAT_MUTE);
          const jho = getTextChannel(server.guild, JHO);
          if (!jho) return;
          await welcomeToEJLX(member, jho);
        }
        if (response === 'DISMISS') {
          await editEmbed(banMenu, {
            footer: `False alarm. ${isLockdown ? 'Unmuted' : 'Dismissed'} by ${
              responder!.tag
            }`,
          });
        } else {
          await editEmbed(banMenu, {
            footer: `Timedout${isLockdown ? ' and unmuted' : ''}.`,
          });
        }
    }
  }
}

export default event;
