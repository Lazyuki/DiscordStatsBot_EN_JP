import { BotEvent } from 'types';
import logger from 'logger';
import { NotFoundError } from 'errors';
import { EJLX } from 'utils/constants';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  processEvent: async (bot, message) => {
    if (message.channel.type === 'DM') return;
    if (message.author.bot || message.system) return;
    if (!message.guild) return;

    const server = bot.servers[message.guild.id];
  },
};

export default event;
