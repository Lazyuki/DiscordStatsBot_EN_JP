import { InvalidSubCommandError } from '@/errors';
import { BotCommand } from '@/types';
import { EJLX, MAINICHI } from '@utils/constants';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import pluralize from '@utils/pluralize';
import { stripIndent } from 'common-tags';

const hardcore: BotCommand = {
  name: 'hardcore',
  allowedServers: [EJLX, MAINICHI],
  requiredServerConfigs: ['japaneseRoles', 'hardcoreRole'],
  aliases: ['hc'],
  description: `Enable/disable hardcore. Use \`{PREFIX}}config\` to manage hardcore related configs.`,
  arguments: '[enable | disable]',
  examples: ['hardcore', 'hc enable'],
  normalCommand: async ({ commandContent, message, server }) => {
    const hardcoreRole = server.config.hardcoreRole;
    const japaneseRole = server.config.japaneseRoles;
    const hardcoreIgnoredChannels = server.config.hardcoreIgnoredChannels;
    const isEnabled = message.member.roles.cache.has(hardcoreRole);
    if (!commandContent) {
      const isJapanese = server.config.japaneseRoles.some((r) =>
        message.member.roles.cache.has(r)
      );
      if (isEnabled) {
        await message.channel.send(
          makeEmbed({
            description: stripIndent`
          You are currently using hardcore mode. You cannot type ${
            isJapanese ? 'Japanese' : 'English'
          } on this server
          ${
            hardcoreIgnoredChannels?.length
              ? ` except in ${hardcoreIgnoredChannels
                  .map((c) => `<#${hardcoreIgnoredChannels}>`)
                  .join(' ')}`
              : ''
          }. 
          `,
            footer: `Type \`${server.config.prefix}hc disable\` to disable.`,
          })
        );
      } else {
        await message.channel.send(
          makeEmbed({
            description: stripIndent`
            If you enable hardcore mode, you will not be able to type ${
              isJapanese ? 'Japanese' : 'English'
            } on this server
          ${
            hardcoreIgnoredChannels?.length
              ? ` except in ${hardcoreIgnoredChannels
                  .map((c) => `<#${hardcoreIgnoredChannels}>`)
                  .join(' ')}`
              : ''
          }. 
          `,
            footer: `Type \`${server.config.prefix}hc enable\` to enable Hardcore.`,
          })
        );
      }
    } else {
      const subCommand = commandContent.split(' ')[0].toLowerCase();
      if (!['enable', 'disable'].includes(subCommand)) {
        throw new InvalidSubCommandError(
          '`hardcore` only accepts the following sub commands: `enable` | `disable`.'
        );
      }
      if (subCommand === 'enable') {
        if (!isEnabled) {
          await message.channel.send(
            successEmbed('Successfully enabled hardcore mode')
          );
        } else {
          await message.channel.send(
            errorEmbed('You already have hardcore mode enabled')
          );
        }
      } else {
        if (isEnabled) {
          await message.channel.send(
            successEmbed('Successfully disabled hardcore mode')
          );
        } else {
          await message.channel.send(
            errorEmbed('You do not have hardcore mode enabled.')
          );
        }
      }
    }
  },
};

export default [hardcore];
