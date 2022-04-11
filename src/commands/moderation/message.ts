import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import {
  cleanEmbed,
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { joinNaturally } from '@utils/formatString';
import { GuildMember, Message } from 'discord.js';
import { getFallbackChannel } from '@utils/asyncCollector';

const command: BotCommand = {
  name: 'message',
  aliases: ['msg'],
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'Send a DM to users. It will be titled as `Message from the moderators of "SERVER_NAME"`. The message will **NOT** be logged in `modlog`.',
  arguments: '<@user> [@user2...] <message>',
  examples: [
    'message @Geralt hello',
    'message 284840842026549259 299335689558949888 please be kind next time',
  ],
  normalCommand: async ({ message, content, server }) => {
    const { members, restContent } = parseMembers(
      content,
      server.guild,
      'MEMBERS'
    );
    if (!restContent) {
      throw new CommandArgumentError('Message content cannot be empty');
    }
    const failedMembers: GuildMember[] = [];
    for (const member of members) {
      try {
        await member.send(
          makeEmbed({
            title: `Message from the moderators of "${server.guild.name}"`,
            description: restContent,
            footer: `Please contact the moderators if you wish to discuss this`,
          })
        );
      } catch (e) {
        failedMembers.push(member);
      }
    }

    if (failedMembers.length === 0) {
      await message.channel.send(successEmbed(`Successfully messaged them`));
      return;
    } else {
      let askFallback: Message;
      if (failedMembers.length === members.length) {
        askFallback = await message.channel.send(
          errorEmbed(
            `Failed to messaged them.\n\n❓ Would you like me to send this in ${
              server.config.userDMFallbackChannel
                ? `<#${server.config.userDMFallbackChannel}>`
                : 'a public channel'
            } and ping them?`
          )
        );
      } else {
        askFallback = await message.channel.send(
          warningEmbed(
            `Successfully messaged them except for ${joinNaturally(
              failedMembers.map((m) => m.toString())
            )}.\n\n❓ **Would you like me to send this in ${
              server.config.userDMFallbackChannel
                ? `<#${server.config.userDMFallbackChannel}>`
                : 'a public channel'
            } and ping them?**`
          )
        );
      }
      const fallbackChannel = await getFallbackChannel(
        askFallback as GuildMessage,
        message.author.id,
        server
      );
      if (fallbackChannel) {
        const fallback = await fallbackChannel?.send(
          makeEmbed({
            content: `${failedMembers.join(
              ' '
            )} We could not send this message as a DM because of your privacy settings. Contact the moderators if you think this is a mistake.`,
            title: `Message from the moderators of "${server.guild.name}"`,
            description: restContent,
          })
        );
        await message.channel.send(
          successEmbed(
            `Successfully sent the message in ${fallbackChannel}.\n[Jump](${fallback.url})`
          )
        );
      } else {
        await message.channel.send(cleanEmbed(`Cancelled`));
      }
    }
  },
};

export default command;
