import env from 'env-var';

import { BotCommand } from '@/types';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';

const DEFAULT_PREFIX = env.get('DEFAULT_PREFIX').required().asString();
const VALID_PREFIX = /^\S{1,10}$/;

const command: BotCommand = {
  name: 'prefix',
  isAllowed: 'SERVER_MODERATOR',
  description:
    'Change the command prefix. Leave blank to restore the default prefix',
  examples: ['prefix c!', 'prefix'],
  normalCommand: async ({ commandContent, server, send }) => {
    const currentPrefix = server.config.prefix;
    if (!commandContent) {
      if (currentPrefix === DEFAULT_PREFIX) {
        await send(
          makeEmbed({
            description: `The command prefix in this server is ${DEFAULT_PREFIX}`,
          })
        );
      } else {
        server.config.prefix = DEFAULT_PREFIX;
        await send(
          successEmbed(
            `The command prefix has been reset from \`${currentPrefix}\` to \`${DEFAULT_PREFIX}\``
          )
        );
      }
    } else {
      if (VALID_PREFIX.test(commandContent)) {
        server.config.prefix = commandContent;
        await send(
          successEmbed(
            `The command prefix has been reset from \`${currentPrefix}\` to \`${commandContent}\``
          )
        );
      } else {
        await send(
          errorEmbed(
            'The command prefix must not contain any spaces and cannot be longer than 10 characters'
          )
        );
      }
    }
  },
};

export default command;
