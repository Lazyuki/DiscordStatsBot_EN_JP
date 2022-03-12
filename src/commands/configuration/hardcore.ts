import { BotCommand } from '@/types';
import { EJLX, MAINICHI } from '@utils/constants';
import { makeEmbed } from '@utils/embed';

declare module '@/types' {
  interface ServerConfig {
    hardcoreIgnoredChannels: string[];
    hardcoreRole: string;
    japaneseRole: string;
  }
}

const hardcore: BotCommand = {
  name: 'hardcore',
  allowedServers: [EJLX, MAINICHI],
  isAllowed: 'SERVER_MODERATOR',
  aliases: ['hc'],
  onCommandInit: (config) => {
    config.hardcoreIgnoredChannels ||= [];
  },
  description:
    'Set up hardcore related configurations. You can set the configurations for `role/japanese/ignored`. You **MUST** set `role` which is a role that enables the hardcore mode, and also set `japanese` which is a role for native japanese speakers.',
  arguments: '[role | japanese | ignore]',
  subCommands: ['role', 'japanese', 'ignore'],
  examples: [
    'hardcore',
    'hardcore japanese @native_japanese_role',
    'hardcore role @hardcore_role',
    'hardcore ignore #bot-spam',
  ],
  normalCommand: async ({ commandContent, message, server }) => {
    const hardcoreRole = server.config.hardcoreRole;
    const japaneseRole = server.config.japaneseRole;
    const hardcoreIgnoredChannels = server.config.hardcoreIgnoredChannels;
    if (!commandContent) {
      const isEnabled = hardcoreRole && japaneseRole;
      await message.channel.send(
        makeEmbed({
          description: `Hardcore mode is ${
            isEnabled ? '**enabled**' : '**disabled**'
          } on this server.${
            isEnabled
              ? ''
              : ' You must have the Hardcore Role and the Native Japanese Speaker Role set up to enable this feature.'
          }`,
          fields: [
            {
              name: 'Hardcore Role',
              value: hardcoreRole
                ? `<&${hardcoreRole}>`
                : `Type \`${server.config.prefix}hardcore role @server's-hardcore-role\` to set this up`,
              inline: true,
            },
            {
              name: 'Native Japanese Speaker Role',
              value: japaneseRole
                ? `<&${japaneseRole}>`
                : `Type \`${server.config.prefix}hardcore japanese @server's-native-japanese-role\` to set this up`,
              inline: true,
            },
            {
              name: 'Hardcore Ignored Channels',
              value: hardcoreIgnoredChannels
                ? hardcoreIgnoredChannels
                    .map((channelId) => `<#${channelId}>`)
                    .join(' ')
                : `No hardcore ignored channels. Type \`${server.config.prefix}hardcore ignore #channel1 #channel2...\` to set this up`,
              inline: true,
            },
          ],
        })
      );
    }
  },
};

export default [hardcore];
