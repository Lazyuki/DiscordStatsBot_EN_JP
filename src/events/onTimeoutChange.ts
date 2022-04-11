import { BotEvent } from '@/types';
import { getTextChannel } from '@utils/guildUtils';
import { makeEmbed } from '@utils/embed';
import { Guild, GuildMember } from 'discord.js';
import { REGEX_AUDIT_LOG_ID } from '@utils/regex';
import { userToMentionAndTag } from '@utils/formatString';
import { getDiscordTimestamp, millisToDuration } from '@utils/datetime';
import { stripIndent } from 'common-tags';
import runAt, { getMemberOrRepeat } from '@utils/runAt';
import Server from '@classes/Server';

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  onServerInit: (server) => {
    if (server.config.timeoutIndicatorRole) {
      const now = new Date().getTime();
      server.guild.members.cache.forEach((member) => {
        const timeout = member.communicationDisabledUntilTimestamp;
        if (timeout) {
          if (timeout - now > 0) {
            runAt(timeout, () =>
              getMemberOrRepeat(member.id, server, removeTimeoutRole)
            );
          }
        }
      });
    }
  },
  processEvent: async (bot, oldMember, newMember) => {
    if (
      oldMember.communicationDisabledUntilTimestamp ===
      newMember.communicationDisabledUntilTimestamp
    ) {
      return; // no timeout change
    }

    const server = bot.servers[newMember.guild.id];
    const timeoutIndicatorRoleId = server.config.timeoutIndicatorRole;

    let mode: 'ADD' | 'REMOVE' | 'UPDATE' | null = null;
    let titleSuffix = '';
    let durationStr = '';
    const now = new Date().getTime();
    const oldTimeoutUntil = oldMember.communicationDisabledUntilTimestamp || 0;
    const newTimeoutUntil = newMember.communicationDisabledUntilTimestamp;

    if (now - oldTimeoutUntil > 10_000 && newTimeoutUntil) {
      // Up to 10 seconds lag
      // The old timeout has already ran out. This is a new timeout.
      mode = 'ADD';
      durationStr = stripIndent`
       ${millisToClosestMinuteDuration(newTimeoutUntil - now)}
       Unmuting at: ${getDiscordTimestamp(
         newTimeoutUntil,
         'F'
       )} (${getDiscordTimestamp(newTimeoutUntil, 'R')})`;
      if (timeoutIndicatorRoleId) {
        await newMember.roles.add(timeoutIndicatorRoleId);
      }
    } else if (newTimeoutUntil) {
      // Updating old timeout
      // Timeout updated
      const milliDiff = newTimeoutUntil - oldTimeoutUntil;
      mode = 'UPDATE';
      titleSuffix = ' Update';
      durationStr = stripIndent`
      ${
        milliDiff > 0 ? 'Extended' : 'Shortened'
      } by ${millisToClosestMinuteDuration(milliDiff)}
      Now unmuting at ${getDiscordTimestamp(
        newTimeoutUntil,
        'F'
      )} (${getDiscordTimestamp(newTimeoutUntil, 'R')})
      
      `;
    } else if (!newTimeoutUntil) {
      // Timeout removed
      mode = 'REMOVE';
      titleSuffix = ' Remove';
      durationStr = `Timeout had ${millisToClosestMinuteDuration(
        oldTimeoutUntil - now
      )} remaining.`;
      if (timeoutIndicatorRoleId) {
        await newMember.roles.remove(timeoutIndicatorRoleId);
      }
    }

    if (!mode) {
      // Couldn't determine what changed
      return;
    }
    if ((mode === 'ADD' || mode === 'UPDATE') && newTimeoutUntil) {
      runAt(newTimeoutUntil, () =>
        getMemberOrRepeat(newMember.id, server, removeTimeoutRole)
      );
    }

    // Check if I should log
    if (!server.config.modActionLogChannel) return;
    const modActionLogChannelId = server.config.modActionLogChannel;
    const modActionLogChannel = getTextChannel(
      server.guild,
      modActionLogChannelId
    );
    if (!modActionLogChannel) return; // no need to log

    const auditLogInfo = await getTimeoutIssuerFromAuditLogs(
      server.guild,
      newMember.id,
      mode
    );
    if (!auditLogInfo) return;
    const { member, delegateBotId, reason } = auditLogInfo;

    // TODO: Still log if timed out through another bot?
    if (member && !delegateBotId) {
      await modActionLogChannel.send(
        makeEmbed({
          title: `Manual Timeout${titleSuffix}`,
          fields: [
            {
              name: 'Timed Out User',
              value: `${userToMentionAndTag(newMember.user)}`,
              inline: false,
            },
            {
              name: 'Duration',
              value: durationStr,
              inline: false,
            },
            {
              name: 'Reason',
              value: reason || 'Unspecified',
              inline: false,
            },
          ],
          footer: `by ${member.user.tag}`,
          footerIcon: member.displayAvatarURL(),
        })
      );
    }
  },
};

function millisToClosestMinuteDuration(millis: number) {
  const minutes = Math.round(millis / 60_000);
  return millisToDuration(minutes * 60_000);
}

async function removeTimeoutRole(member: GuildMember, server: Server) {
  if (server.config.timeoutIndicatorRole) {
    const unmuteAt = member.communicationDisabledUntilTimestamp;
    const now = new Date().getTime();
    if (!unmuteAt || Math.abs(unmuteAt - now) < 5_000) {
      await member.roles.remove(server.config.timeoutIndicatorRole);
    }
  }
}

interface TimeoutChangeAuditLogEntry {
  key: 'communication_disabled_until';
  old: string | undefined; // ISO string e.g. 2022-04-05T00:17:52.577000+00:00
  new: string | undefined; // ISO string e.g. 2022-04-05T00:17:52.577000+00:00
}

async function getTimeoutIssuerFromAuditLogs(
  guild: Guild,
  userId: string,
  mode: 'ADD' | 'REMOVE' | 'UPDATE'
) {
  if (!guild.me?.permissions.has('VIEW_AUDIT_LOG')) {
    // can't view audit log then I can't do anything
    return;
  }
  const auditLogs = await guild.fetchAuditLogs({
    limit: 20,
    type: 'MEMBER_UPDATE',
  });
  let timeoutIssuerId: string | null = null;
  let delegateBotId: string | null = null;
  let timeoutReason = '';
  const now = new Date().getTime();
  auditLogs.entries
    .filter((e) => e.target?.id === userId)
    .forEach((entry) => {
      const executor = entry.executor;
      if (timeoutIssuerId) return; // Already found one.
      if (!executor) return; // Timeout expired naturally?
      let executorId = executor.id;
      let entryThroughBot: string | null = null;
      let entryReason = entry.reason || '';
      if (executor.bot) {
        const reason = entry.reason;
        if (reason?.includes('CIRI_SELFMUTE')) {
          // ignore self mute
          return;
        }
        const match = reason?.match(REGEX_AUDIT_LOG_ID); // Timeout reason must contain the user ID of the issuer
        if (match) {
          entryThroughBot = executor.id;
          executorId = match[1];
          entryReason = reason?.split('Reason: ')[1] || 'Unspecified';
        }
      }
      entry.changes?.forEach((change) => {
        if (change.key !== 'communication_disabled_until') return; // not about timeout
        const timeoutChange = change as TimeoutChangeAuditLogEntry;
        if (timeoutIssuerId) return; // already found
        if (mode === 'REMOVE' && !timeoutChange.new) {
          timeoutIssuerId = executorId;
          delegateBotId = entryThroughBot;
          timeoutReason = entryReason;
        } else if ((mode === 'ADD' || mode === 'UPDATE') && timeoutChange.new) {
          const oldTime = timeoutChange.old
            ? new Date(timeoutChange.old)
            : null;
          const newTime = new Date(timeoutChange.new);
          if (newTime.getTime() < now) {
            return; // Audit log for the past event.
          }
          const isAdd = !oldTime || now - oldTime.getTime() > 10_000;
          if (mode === 'ADD' && isAdd) {
            // is ADD
            timeoutIssuerId = executorId;
            delegateBotId = entryThroughBot;
            timeoutReason = entryReason;
          } else if (mode === 'UPDATE' && !isAdd) {
            timeoutIssuerId = executorId;
            delegateBotId = entryThroughBot;
            timeoutReason = entryReason;
          }
        }
      });
    });
  if (timeoutIssuerId) {
    return {
      member: guild.members.cache.get(timeoutIssuerId) ?? null,
      delegateBotId,
      reason: timeoutReason,
    };
  }
  return null;
}

export default event;
