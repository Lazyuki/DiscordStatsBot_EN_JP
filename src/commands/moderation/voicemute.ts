import { BotCommand } from '@/types';
import { insertModLog } from '@database/statements';
import { parseMembers } from '@utils/argumentParsers';
import { makeEmbed, successEmbed } from '@utils/embed';
import { joinNaturally, userToMentionAndTag } from '@utils/formatString';
import { getTextChannel } from '@utils/guildUtils';
import { GuildMember } from 'discord.js';

const voicemute: BotCommand = {
  name: 'voiceMute',
  aliases: ['vm'],
  isAllowed: ['MUTE_MEMBERS'],
  requiredServerConfigs: ['voiceMuteRoles'],
  requiredBotPermissions: ['MUTE_MEMBERS', 'MANAGE_ROLES'],
  description: 'Voice mute people',
  arguments: '<@user> [@user2...] [reason]',
  childCommands: ['voiceUnmute'],
  examples: [
    'vm @Geralt being too good at Japanese',
    'vm 284840842026549259 299335689558949888 shut up',
  ],
  normalCommand: async ({ content, message, server }) => {
    const { members, restContent } = parseMembers(content, server.guild);
    const reason = restContent || 'Unspecified';
    const noDMs: GuildMember[] = [];

    const date = new Date().toISOString();
    const addModLog = (userId: string) => {
      insertModLog({
        kind: 'mute',
        guildId: server.guild.id,
        userId,
        date,
        issuerId: message.author.id,
        messageLink: message.url,
        silent: false,
        content: reason,
        duration: null,
      });
    };
    for (const member of members) {
      addModLog(member.id);
      if (member.voice.channel) {
        await member.voice.setMute(
          true,
          `By ${message.author.tag} (${message.author.id}). Reason: ${reason}`
        );
      }
      await member.roles.add(server.config.voiceMuteRoles); // Voice mute role
      try {
        await member.send(
          makeEmbed({
            color: 'RED',
            title: `You have been voice muted in the "${server.guild.name}" server`,
            description: `Reason: ${reason}`,
            footer:
              'Contact one of the mods if you need to discuss this issue.',
          })
        );
      } catch (e) {
        noDMs.push(member);
      }
    }

    const failedAllDMs = noDMs.length === members.length;
    const dmInfo = failedAllDMs
      ? 'but failed to DM the reason to them'
      : noDMs.length
      ? `and DMed them except for ${joinNaturally(
          noDMs.map((m) => m.toString())
        )}`
      : 'and DMed them';
    await message.channel.send(
      successEmbed(
        `Successfully muted ${joinNaturally(
          members.map((m) => m.toString())
        )} ${dmInfo}`
      )
    );
    if (server.config.modActionLogChannel) {
      const modChannel = getTextChannel(
        server.guild,
        server.config.modActionLogChannel
      );
      await modChannel?.send(
        makeEmbed({
          title: `Voice Mute`,
          fields: [
            {
              name: 'Muted Users',
              value: members
                .map((m) => `${userToMentionAndTag(m.user)}`)
                .join('\n'),
              inline: false,
            },
            {
              name: 'Reason',
              value: reason,
              inline: false,
            },
          ],
          footer: `By ${message.author.tag} in #${message.channel.name}`,
          footerIcon: message.member.displayAvatarURL(),
          timestamp: true,
        })
      );
    }
  },
};

const voiceunmute: BotCommand = {
  name: 'voiceUnmute',
  isAllowed: ['MUTE_MEMBERS'],
  requiredBotPermissions: ['MUTE_MEMBERS', 'MANAGE_ROLES'],
  aliases: ['uvm', 'vum', 'unvoicemute'],
  description: 'Remove voice mutes from people',
  arguments: '<@user> [reason]',
  examples: [
    'uvm @Geralt being too good at Japanese',
    'uvm 284840842026549259 299335689558949888 shut up',
  ],
  parentCommand: 'voiceMute',
  normalCommand: async ({ content, message, server }) => {
    const { members, restContent } = parseMembers(content, server.guild);
    const reason = restContent || 'Unspecified';
    for (const member of members) {
      await member.voice.setMute(
        false,
        `By ${message.author.tag} (${message.author.id}). Reason: ${reason}`
      );
      await member.roles.remove(server.config.voiceMuteRoles); // Voice mute role
    }
    await message.channel.send(
      successEmbed(
        `Successfully unmuted ${joinNaturally(
          members.map((m) => m.toString())
        )} in VC`
      )
    );
    if (server.config.modActionLogChannel) {
      const modChannel = getTextChannel(
        server.guild,
        server.config.modActionLogChannel
      );
      await modChannel?.send(
        makeEmbed({
          title: `Voice Unmute`,
          fields: [
            {
              name: 'Unmuted Users',
              value: members
                .map((m) => `${userToMentionAndTag(m.user)}`)
                .join('\n'),
              inline: false,
            },
            {
              name: 'Reason',
              value: reason,
              inline: false,
            },
          ],
          footer: `By ${message.author.tag} in #${message.channel.name}`,
          footerIcon: message.member.displayAvatarURL(),
          timestamp: true,
        })
      );
    }
  },
};

export default [voicemute, voiceunmute];
