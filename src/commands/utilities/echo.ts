import { BotCommand } from '@/types';
import { cleanEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';
import { codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'echo',
  description: 'Repeat your message inside a code block',
  normalCommand: async ({ message, content }) => {
    await message.channel.send(cleanEmbed(codeBlock(content)));
  },
};

export default command;
