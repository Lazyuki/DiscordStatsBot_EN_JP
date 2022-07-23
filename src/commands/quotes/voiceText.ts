import { BotCommand } from '@/types';
import { EJLX, VOICE_1, VOICE_2, VOICE_BOT } from '@utils/constants';
import { errorEmbed, makeEmbed, warningEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';
import { parseMembers } from '@utils/argumentParsers';
import { GuildMember, VoiceChannel } from 'discord.js';
import { getCategoryId } from '@utils/guildUtils';

const command: BotCommand = {
  name: 'voiceText',
  aliases: ['vt'],
  allowedServers: [EJLX],
  description:
    'Let people know that they need to use appropriate voice text channels. You can mention people or reply to a message, otherwise the bot will automatically look up the channel and see which users are in VC.',
  arguments: '[users]',
  examples: ['vt', 'vt @user1 @user2'],
  normalCommand: async ({ message, content, server }) => {
    safeDelete(message);
    const { members } = parseMembers(content, server.guild);
    const vcMembers: GuildMember[] = [];
    const categoryId = getCategoryId(message.channel);
    if (!categoryId) return;
    if (
      message.guild.channels.cache.get(categoryId)?.name.toLowerCase() ===
      'voice'
    ) {
      await message.channel.send(
        warningEmbed(`You are already in the voice category`)
      );
      return;
    }
    if (members.length) {
      vcMembers.push(...members);
    } else if (message.reference) {
      const ref = await message.fetchReference();
      ref.member && vcMembers.push(ref.member);
    } else {
      const messages = await message.channel.messages.fetch({ limit: 30 });
      messages.forEach((m) => {
        if (m.member?.voice.channel) {
          const member = m.member;
          if (vcMembers.includes(member)) return;
          vcMembers.push(member);
        }
      });
    }

    if (vcMembers.length === 0) {
      await message.channel.send(errorEmbed(`Couldn't find any users in VC`));
      return;
    }
    const voiceChannels = [
      ...new Set(vcMembers.map((mem) => mem.voice.channel).filter(Boolean)),
    ] as VoiceChannel[];
    await message.channel.send(
      makeEmbed({
        content: vcMembers.map((m) => m.toString()).join(''),
        description: `If you want to send text messages while in voice chat, please use the integrated text chat in ${voiceChannels
          .map(
            (vc) =>
              `[#${vc.name}](https://discord.com/channels/${vc.guildId}/${
                vc.id
              }/${vc.lastMessageId || 1})`
          )
          .join(
            ', '
          )} or <#${VOICE_BOT}>.\n通話中のテキストチャットには${voiceChannels
          .map(
            (vc) =>
              `[#${vc.name}](https://discord.com/channels/${vc.guildId}/${
                vc.id
              }/${vc.lastMessageId || 1})`
          )
          .join(' ')} <#${VOICE_BOT}>を使用してください。`,
        color: 'Red',
      })
    );
  },
};

export default command;
