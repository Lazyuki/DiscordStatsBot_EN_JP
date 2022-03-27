import { BotCommand } from '@/types';
import { cleanEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';
import { codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'echo',
  description: 'Repeat your message inside a code block',
  normalCommand: async ({ message }) => {
    await message.channel.send(cleanEmbed(codeBlock(message.content)));
  },
};

export default command;
