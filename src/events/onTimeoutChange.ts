import { BotEvent } from '@/types';
import { getTextChannel } from '@utils/guildUtils';
import { makeEmbed } from '@utils/embed';
import { Guild } from 'discord.js';
import { REGEX_AUDIT_LOG_ID } from '@utils/regex';
import { userToMentionAndTag } from '@utils/formatString';
import { getDiscordTimestamp, millisToDuration } from '@utils/datetime';
import { stripIndent } from 'common-tags';

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMember, newMember) => {
    if (
      oldMember.communicationDisabledUntilTimestamp ===
      newMember.communicationDisabledUntilTimestamp
    ) {
      return; // no timeout change
    }

    const server = bot.servers[newMember.guild.id];
    const timeoutIndicatorRoleId = server.config.timeoutIndicatorRole;

    let mode: 'ADD' | 'REMOVE' | 'UPDATE';
    let titleSuffix = '';
    let durationStr = '';
    const now = new Date().getTime();
    if (!newMember.communicationDisabledUntil) {
      // Timeout removed
      mode = 'REMOVE';
      titleSuffix = ' Remove';
      durationStr = `Timeout had ${millisToDuration(
        oldMember.communicationDisabledUntil!.getTime() - now
      )} remaining.`;
      if (timeoutIndicatorRoleId) {
        await newMember.roles.remove(timeoutIndicatorRoleId);
      }
    } else if (!oldMember.communicationDisabledUntil) {
      // Timeout added
      mode = 'ADD';
      durationStr = stripIndent`
      ${millisToDuration(newMember.communicationDisabledUntil!.getTime() - now)}
      Unmuting at: ${getDiscordTimestamp(
        newMember.communicationDisabledUntil,
        'F'
      )} (in ${getDiscordTimestamp(
        newMember.communicationDisabledUntil,
        'R'
      )})`;
      if (timeoutIndicatorRoleId) {
        await newMember.roles.add(timeoutIndicatorRoleId);
      }
    } else {
      // Timeout updated
      const milliDiff =
        newMember.communicationDisabledUntil.getTime() -
        oldMember.communicationDisabledUntil.getTime();
      mode = 'UPDATE';
      titleSuffix = ' Update';
      durationStr = stripIndent`
      ${milliDiff > 0 ? 'Extended' : 'Shortened'} by ${millisToDuration(
        milliDiff
      )}
      Now unmuting at ${getDiscordTimestamp(
        newMember.communicationDisabledUntil,
        'F'
      )} (in ${getDiscordTimestamp(newMember.communicationDisabledUntil, 'R')})
      
      `;
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
              value: reason,
              inline: false,
            },
          ],
        })
      );
    }
  },
};

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
        } else if (mode === 'ADD' && !timeoutChange.old) {
          timeoutIssuerId = executorId;
          delegateBotId = entryThroughBot;
          timeoutReason = entryReason;
        } else if (
          mode === 'UPDATE' &&
          timeoutChange.old &&
          timeoutChange.new
        ) {
          timeoutIssuerId = executorId;
          delegateBotId = entryThroughBot;
          timeoutReason = entryReason;
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
  return {
    member: null,
    delegateBotId,
    reason: '',
  };
}

export default event;
