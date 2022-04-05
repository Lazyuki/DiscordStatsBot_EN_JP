import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMessageId, parseSubCommand } from '@utils/argumentParsers';
import { errorEmbed, infoEmbed, successEmbed } from '@utils/embed';
import { getTextChannel } from '@utils/guildUtils';
import {
  REGEX_CUSTOM_EMOTES,
  REGEX_MESSAGE_LINK_OR_FULL_ID,
  REGEX_RAW_ID,
  REGEX_UNICODE_EMOJI,
} from '@utils/regex';

declare module '@/types' {
  interface ServerData {
    selfRoles: Record<string, string>;
    selfRoleMessageId?: string;
  }
}

const sar: BotCommand = {
  name: 'reactinRoles',
  aliases: ['sar'],
  isAllowed: ['ADMIN'],
  requiredBotPermissions: ['ADD_REACTIONS', 'MANAGE_MESSAGES'],
  description: 'Configure reaction based self assignable roles (sar). ',
  arguments:
    '[add | remove | list | link | update ] [emoji] [@role/role ID] [message link]',
  examples: [
    'sar list',
    'sar add 📝 1234567891234567890',
    'sar add <:customEmoji:1234567891234567890> @SomeRole',
    'sar remove <:customEmoji:1234567891234567890>',
    'sar remove 📝',
    [
      'sar link https://discord.com/channels/1234568 ... 115634688',
      'Link the message that Ciri should listen to for adding roles based on reactions. You may use the `send` or `edit` command to make Ciri send the message in a desired channel.',
    ],
    [
      'sar update',
      'Once the message has been linked, this command will make Ciri add the reactions. When you add/remove reaction roles, run this command again to update the reactions on the message',
    ],
  ],
  onCommandInit: (server) => {
    server.data.selfRoles ||= {};
  },
  normalCommand: async ({ content, message, server, options }) => {
    const { subCommand, restContent } = content
      ? parseSubCommand(content, ['add', 'remove', 'list', 'link', 'update'])
      : { subCommand: 'list', restContent: '' };

    const currentSelfRoles = server.data.selfRoles;

    switch (subCommand) {
      case 'list': {
        await message.channel.send(
          infoEmbed({
            title: `Current server reaction roles${
              server.data.selfRoleMessageId ? '' : ' [INCOMPLETE]'
            }`,
            description:
              Object.entries(currentSelfRoles)
                ?.map(([emoji, roleId]) => `${emoji}: <@&${roleId}`)
                .join('\n') || 'None',
            fields: [
              {
                name: 'Message Link',
                value: server.data.selfRoleMessageId
                  ? `https://discord.com/channels/${
                      server.guild.id
                    }/${server.data.selfRoleMessageId.replace('-', '/')}`
                  : `None set. Use \`${server.config.prefix}sar link\` to link a message`,
                inline: false,
              },
            ],
          })
        );
        return;
      }
      case 'add': {
        const [emoji, role] = restContent.split(' ');
        const validEmoji =
          REGEX_CUSTOM_EMOTES.test(emoji) || REGEX_UNICODE_EMOJI.test(emoji);
        if (!validEmoji) {
          throw new CommandArgumentError(`Invalid emoji: ${emoji}`);
        }
        const roleId = role.match(REGEX_RAW_ID)?.[0];
        if (!roleId || !server.guild.roles.cache.has(roleId)) {
          throw new CommandArgumentError(
            `Invalid role: ${role}. Please mention it or use the ID`
          );
        }
        server.data.selfRoles[emoji] = roleId;
        server.save();
        await message.channel.send(
          successEmbed(`Successfully mapped ${emoji} to <@$${roleId}>`)
        );
        return;
      }
      case 'remove': {
        if (restContent in server.data.selfRoles) {
          const roleId = server.data.selfRoles[restContent];
          delete server.data.selfRoles[restContent];
          await message.channel.send(
            successEmbed(
              `Successfully removed ${restContent} (<@&${roleId}>) from reaction roles`
            )
          );
        } else {
          await message.channel.send(
            errorEmbed(
              `The reaction "${restContent}" is not used in reaction roles`
            )
          );
        }
        return;
      }
      case 'link': {
        const reactionMessage = await parseMessageId(restContent, server.guild);

        server.data.selfRoleMessageId = `${reactionMessage.channelId}-${reactionMessage.id}`;
        await message.channel.send(
          successEmbed(
            `Message linked. Run \`${server.config.prefix}sar update\` to add reactions to the message.`
          )
        );
        server.save();
        return;
      }
      case 'update': {
        if (!server.data.selfRoleMessageId) {
          throw new CommandArgumentError(
            `You have to set the reaction role message first with \`${server.config.prefix}sar link MESSAGE_LINK\` where the MESSAGE_LINK is the link to the static message`
          );
        } else {
          const reactionMessage = await parseMessageId(
            server.data.selfRoleMessageId,
            server.guild
          );

          for (const reaction of reactionMessage.reactions.cache.values()) {
            if (!(reaction.emoji.toString() in server.data.selfRoles)) {
              await reaction.remove();
            }
          }
          for (const emoji in server.data.selfRoles) {
            await reactionMessage.react(emoji);
          }
          await message.channel.send(
            successEmbed(`Message reactions updated.`)
          );
        }
      }
    }
  },
};

export default sar;
