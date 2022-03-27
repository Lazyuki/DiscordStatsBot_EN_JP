import { BotCommand } from '@/types';
import { EJLX, EXTERNAL_LINK_EMOJI, INFO_COLOR } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'bonyari',
  aliases: ['bon'],
  allowedServers: [EJLX],
  description: "Bonyari#8184's guide",
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: INFO_COLOR,
        title: `**HOW TO LEARN JAPANESE EFFICIENTLY** ${EXTERNAL_LINK_EMOJI}`,
        titleUrl:
          'https://docs.google.com/document/d/19FEIOJWbLhJQ-AmepxFBMC2ebhJJr9RBUMfMeatYuq8/edit?usp=sharing',
        footer: 'Written by Bonyari Boy',
      })
    );
  },
};

export default command;
