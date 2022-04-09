import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { pseudoShlexSplit } from '@utils/formatString';
import { getButtonsTest } from '@utils/buttons';

const command: BotCommand = {
  name: 'test',
  isAllowed: ['BOT_OWNER'],
  description: 'random test script',
  normalCommand: async ({ content, message, bot, server, reply, send }) => {
    const buttonLabels = pseudoShlexSplit(content);
    const components = getButtonsTest(buttonLabels);
    await message.channel.send({ content: 'button test', components });
  },
};

export default command;
