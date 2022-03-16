import {
  Guild,
  GuildMember,
  PartialGuildMember,
  TextBasedChannel,
} from 'discord.js';

import { makeEmbed } from '@utils/embed';
import { EJLX, EJLX_LANG_ROLE_IDS, EWBF, RAI } from '@utils/constants';
import { BotEvent } from '@/types';
import { getTextChannel } from '@utils/discordGetters';
import { REGEX_RAW_ID } from '@utils/regex';
import pluralize from '@utils/pluralize';

type Member = PartialGuildMember | GuildMember;

async function getRoleChangeAuditLogs(guild: Guild, userId: string) {
  const auditLogs = await guild.fetchAuditLogs({
    limit: 20,
    type: 'MEMBER_ROLE_UPDATE',
  });
  const actions: Record<string, { add: string[]; remove: string[] }> = {};
  auditLogs.entries
    .filter((e) => e.targetType === 'USER' && e.target?.id === userId)
    .forEach((entry) => {
      const executor = entry.executor;
      if (!executor) return;
      let executorId = executor.id;
      if (executor.bot) {
        const reason = entry.reason;
        const match = reason?.match(REGEX_RAW_ID); // Issued by
        if (match) executorId = match[0];
      }
      const newActions = actions[executorId] || { add: [], remove: [] };
      entry.changes?.forEach((change) => {
        console.log(change);
        if (change.old) {
          newActions.remove.push(change.old as string);
        } else {
          newActions.add.push(change.old as string);
        }
      });
      actions[executorId] = newActions;
    });
  return actions;
}

async function notifyLanguageRoleChange(
  userId: string,
  channel: TextBasedChannel
) {
  const { oldMember, newMember } = bulkUpdator[userId] ?? {};
  delete bulkUpdator[userId];
  if (!oldMember || !newMember) return;
  const oldRoles = oldMember.roles.cache.filter((v) =>
    EJLX_LANG_ROLE_IDS.includes(v.id)
  );
  const newRoles = newMember.roles.cache.filter((v) =>
    EJLX_LANG_ROLE_IDS.includes(v.id)
  );
  const roleDiff = oldRoles.difference(newRoles);
  if (roleDiff.size === 0) return;
  const roleChanges = await getRoleChangeAuditLogs(newMember.guild, userId);
  const executors = Object.keys(roleChanges).map(
    (executorId) =>
      newMember.guild.members.cache.get(executorId)?.user.tag || 'unknown'
  );

  // only 1 person changed the roles
  if (oldRoles.size === 0) {
    // Only added new roles
    await channel.send(
      makeEmbed({
        color: '#fca503',
        description: `${newMember}'s language role${pluralize(
          '',
          's have',
          newRoles.size,
          ' has'
        )} been set to ${newRoles.map((r) => r).join(' ')} by ${executors.join(
          ', '
        )}`,
        footer: `${newMember.user.tag} language role update`,
      })
    );
  } else {
    await channel.send(
      makeEmbed({
        color: '#fca503',
        description: `${newMember}'s language role${pluralize(
          '',
          's have',
          newRoles.size,
          ' has'
        )} been set to ${newRoles.map((r) => r).join(' ')} instead of ${oldRoles
          .map((r) => `\`${r.name}\``)
          .join(', ')} by ${executors.join(', ')}`,
        footer: `${newMember.user.tag} language role update`,
      })
    );
  }
}

const bulkUpdator: Record<string, { oldMember: Member; newMember: Member }> =
  {};

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMember, newMember) => {
    if (newMember.guild.id !== EJLX) return;
    const roleDiff = oldMember.roles.cache.difference(newMember.roles.cache);
    if (roleDiff.size && EJLX_LANG_ROLE_IDS.some((r) => roleDiff.has(r))) {
      // EJLX language role update
      if (newMember.id in bulkUpdator) {
        bulkUpdator[newMember.id]['newMember'] = newMember;
      } else {
        const ewbf = getTextChannel(newMember.guild, EWBF);
        if (!ewbf) return;
        bulkUpdator[newMember.id] = {
          oldMember,
          newMember,
        };
        setTimeout(async () => {
          await notifyLanguageRoleChange(newMember.id, ewbf);
        }, 10_000);
      }
    }
  },
};

export default event;
