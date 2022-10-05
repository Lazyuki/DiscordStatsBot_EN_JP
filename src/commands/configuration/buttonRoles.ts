import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import {
  parseChannels,
  parseMessageId,
  parseSubCommand,
} from '@utils/argumentParsers';
import { getButtonsWithLabels } from '@utils/buttons';
import { errorEmbed, infoEmbed, successEmbed } from '@utils/embed';
import { pseudoShlexSplit } from '@utils/formatString';
import { fetchMessage } from '@utils/guildUtils';
import { REGEX_CUSTOM_EMOTES, REGEX_RAW_ID } from '@utils/regex';

declare module '@/types' {
  interface ServerData {
    buttonRoles: {
      roles: Record<string, [string, string]>;
      description?: string;
      messageId?: string;
    };
  }
}

const sar: BotCommand = {
  name: 'buttonRoles',
  aliases: ['br'],
  isAllowed: ['ADMIN'],
  requiredBotPermissions: ['ManageRoles'],
  description: 'Configure button based self assignable roles.',
  arguments:
    '[ add | remove | list | describe | send | update | reset ] [label] [@role/role_ID description]',
  examples: [
    'br list',
    'br add 📝 1234567891234567890 This role indicates you want people to correct your messages',
    'br add <:customEmoji:1234567891234567890> 1234567891234567890 Some description, idk',
    [
      'br add "Ultra Hardcore" @ultrahardcore This role will DELETE your messages not in your learning language',
      'You can use double quotes `" "` if the label contains spaces',
    ],
    'br remove <:customEmoji:1234567891234567890>',
    'br remove 📝',
    'br describe Click the buttons below to assign/remove roles from yourself.',
    [
      'br send #server_rules',
      'Let Ciri send the message with buttons. You may use the `edit` command to change the message content.',
    ],
    [
      'br update',
      'Once the button role message has been sent, this command will make Ciri add/remove new buttons. When you add/remove button roles, run this command again to update the buttons on the message',
    ],
    ['br reset', 'Reset the button role configuration'],
  ],
  onCommandInit: (server) => {
    server.data.buttonRoles ||= { roles: {} };
    if (server.data.buttonRoles.messageId) {
      // let discord.js cache this message
      fetchMessage(server.guild, server.data.buttonRoles.messageId);
    }
  },
  normalCommand: async ({ content, message, server, options }) => {
    const { subCommand, restContent } = content
      ? parseSubCommand(content, [
          'add',
          'rm',
          'rem',
          'remove',
          'list',
          'send',
          'describe',
          'desc',
          'update',
          'reset',
        ])
      : { subCommand: 'list', restContent: '' };

    const currentSettings = server.data.buttonRoles;

    switch (subCommand) {
      case 'list': {
        await message.channel.send(
          infoEmbed({
            title: `Current server button roles`,
            description:
              Object.entries(currentSettings.roles)
                ?.map(
                  ([emoji, [roleId, description]]) =>
                    `- **${emoji}**: <@&${roleId}> "${description}"`
                )
                .join('\n') || 'No button roles set',
            fields: [
              {
                name: 'Button Role Message',
                value: currentSettings.messageId
                  ? `https://discord.com/channels/${
                      server.guild.id
                    }/${currentSettings.messageId.replace('-', '/')}`
                  : `None set. Use \`${server.config.prefix}br send\` to initialize button roles`,
                inline: false,
              },
            ],
          })
        );
        return;
      }
      case 'add': {
        const [quotedLabel, role, ...descriptionArr] =
          pseudoShlexSplit(restContent);
        const description = descriptionArr.join(' ').trim();
        const label = /^".+"$/.test(quotedLabel)
          ? quotedLabel.substring(1, quotedLabel.length - 1)
          : quotedLabel;

        const isCustomEmoji = REGEX_CUSTOM_EMOTES.test(label);
        if (isCustomEmoji && !/^<[^>]+>.*$/.test(label)) {
          throw new CommandArgumentError(
            `Discord emoji can only be used at the front.`
          );
        }
        const roleId = role.match(REGEX_RAW_ID)?.[0];
        if (!roleId || !server.guild.roles.cache.has(roleId)) {
          throw new CommandArgumentError(
            `Invalid role: ${role}. Please mention it or use the ID`
          );
        }
        const existing = currentSettings.roles[label];
        if (!existing && Object.keys(currentSettings.roles).length === 25) {
          throw new CommandArgumentError(
            'You can only have up to 25 button roles'
          );
        }
        currentSettings.roles[label] = [roleId, description];
        server.save();
        await message.channel.send(
          successEmbed(
            `Successfully ${
              existing ? 'updated' : 'mapped'
            } **${label}** to <@&${roleId}> with the description:\n"${description}"`
          )
        );
        return;
      }
      case 'rm':
      case 'rem':
      case 'remove': {
        if (restContent in currentSettings.roles) {
          const [roleId, _] = currentSettings.roles[restContent];
          delete currentSettings.roles[restContent];
          await message.channel.send(
            successEmbed(
              `Successfully removed ${restContent} (<@&${roleId}>) from button roles. Run \`br update\` to reflect the changes`
            )
          );
        } else {
          await message.channel.send(
            errorEmbed(`The label "${restContent}" is not used in button roles`)
          );
        }
        return;
      }
      case 'desc':
      case 'describe': {
        currentSettings.description = restContent;
        server.save();
        await message.channel.send(
          successEmbed(`The button role description has been set`)
        );
        return;
      }
      case 'send': {
        const { textChannels } = parseChannels(restContent, server.guild);
        const channel = textChannels?.[0] || message.channel;
        const roles = Object.entries(currentSettings.roles);
        if (roles.length === 0) {
          throw new CommandArgumentError('No button roles set');
        }
        if (server.data.buttonRoles.messageId) {
          const currMessage = await fetchMessage(
            server.guild,
            server.data.buttonRoles.messageId
          );
          if (currMessage) {
            // delete old message
            await currMessage.delete();
          }
        }
        const buttonMessage = await channel.send(
          generateButtonRoleMessage(currentSettings)
        );

        currentSettings.messageId = `${buttonMessage.channelId}-${buttonMessage.id}`;
        if (channel.id !== message.channel.id) {
          await message.channel.send(
            successEmbed(`Successfully sent the button role message.`)
          );
        }
        server.save();
        return;
      }
      case 'update': {
        if (!currentSettings.messageId) {
          throw new CommandArgumentError(
            `You have to set the button role message first with \`${server.config.prefix}br send\``
          );
        }
        const roles = Object.entries(currentSettings.roles);
        if (roles.length === 0) {
          throw new CommandArgumentError('No button roles set');
        }
        const buttonMessage = await parseMessageId(
          currentSettings.messageId,
          server.guild
        );
        await buttonMessage.edit(generateButtonRoleMessage(currentSettings));
        await message.channel.send(
          successEmbed(`Button role message updated.`)
        );
        return;
      }
      case 'reset': {
        if (server.data.buttonRoles.messageId) {
          const currMessage = await fetchMessage(
            server.guild,
            server.data.buttonRoles.messageId
          );
          if (currMessage) {
            await currMessage.delete();
          }
        }
        server.data.buttonRoles = { roles: {} };
        server.save();
        await message.channel.send(
          successEmbed(`Button roles have been reset`)
        );
        return;
      }
    }
  },
};

function generateButtonRoleMessage(buttonRoles: {
  roles: Record<string, [string, string]>;
  description?: string;
  messageId?: string;
}) {
  const roles = Object.entries(buttonRoles.roles);
  const content = `${buttonRoles.description || ''}\n${roles
    .map(([label, [roleId, description]]) => {
      return `**${label}**: ${description}`;
    })
    .join(`\n`)}`;
  const components = getButtonsWithLabels(roles.map((r) => r[0]));
  return { content, components };
}

export default sar;
