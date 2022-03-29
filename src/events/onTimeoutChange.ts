import { BotEvent } from '@/types';
import { insertDeletes, insertMessages } from '@database/statements';
import { DELETE_COLOR, EJLX, MAINICHI, MOD_LOG } from '@utils/constants';
import checkSafeMessage from '@utils/checkSafeMessage';
import {
  getParentChannelId,
  getTextChannel,
  isMessageInChannels,
  isNotDM,
} from '@utils/guildUtils';
import { makeEmbed } from '@utils/embed';
import { formatDuration, intervalToDuration } from 'date-fns';
import { Guild } from 'discord.js';
import { REGEX_AUDIT_LOG_ID } from '@utils/regex';

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMember, newMember) => {
    if (
      oldMember.communicationDisabledUntil ===
      newMember.communicationDisabledUntil
    ) {
      return;
    }

    if (!newMember.guild.me?.permissions.has('VIEW_AUDIT_LOG')) {
      // can't view audit log then I can't do anything
      return;
    }

    // Check if I should log
    const server = bot.servers[newMember.guild.id];
    await getTimeoutAuditLogs(server.guild, newMember.id);
    if (!server.config.modActionLogChannel) return;
    const modActionLogChannelId = server.config.modActionLogChannel;
    const modActionLogChannel = getTextChannel(
      server.guild,
      modActionLogChannelId
    );

    if (!modActionLogChannel) return;
    await getTimeoutAuditLogs(server.guild, newMember.id);
    if (!newMember.communicationDisabledUntil) {
      // Timeout removed
    } else if (!oldMember.communicationDisabledUntil) {
      // Timeout added
    } else {
      // Timeout updated
    }
  },
};

interface TimeoutChangeAuditLogEntry {
  key: 'communication_disabled_until';
  old: string | undefined; // ISO string
  new: string | undefined; // ISO string
}

async function getTimeoutAuditLogs(guild: Guild, userId: string) {
  const auditLogs = await guild.fetchAuditLogs({
    limit: 20,
    type: 'MEMBER_UPDATE',
  });
  const actions: Record<string, { add: string[]; remove: string[] }> = {};
  auditLogs.entries
    .filter((e) => e.target?.id === userId)
    .forEach((entry) => {
      const executor = entry.executor;
      if (!executor) return;
      let executorId = executor.id;
      if (executor.bot) {
        const reason = entry.reason;
        const match = reason?.match(REGEX_AUDIT_LOG_ID); // Timeout reason must contain the user ID of the issuer
        if (match) executorId = match[1];
        if (reason?.includes('CIRI_SELFMUTE')) {
          executorId = entry.target!.id;
        }
      }
      entry.changes?.forEach((change) => {
        change = change as TimeoutChangeAuditLogEntry;
      });
    });
  Object.keys(actions).forEach((executorId) => {
    const changes = actions[executorId];
    if (changes.add.length === 0 && changes.remove.length === 0) {
      delete actions[executorId];
    }
  });
  return actions;
}

export default event;
