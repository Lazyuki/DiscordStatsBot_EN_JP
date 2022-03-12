import { CIRILLA, ACTIVE_STAFF } from '@utils/constants';
import { BotEvent } from '@/types';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (
      message.author.id === CIRILLA &&
      message.content.includes(ACTIVE_STAFF)
    ) {
      // line
    }
  },
};

export default event;
