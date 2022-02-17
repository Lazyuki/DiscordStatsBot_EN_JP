import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { makeEmbed } from '@utils/embed';

const command: BotCommand = {
  allowedServers: [EJLX],
  description:
    'Readme message for new users in English. Use `,yonde` for Japanese.',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    const mentioned = message.mentions.members?.first();
    await message.delete();
    await message.channel.send(
      makeEmbed({
        color: 'LUMINOUS_VIVID_PINK',
        title: `WELCOME${
          mentioned ? ' ' + mentioned.user.username : ''
        }!! 🎉 READ ME!`,
        description:
          '__**[Japanese Starting Guide](https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md)**__<:externallink:438354612379189268>',
        mainImage: 'https://i.imgur.com/MmAIJzT.png',
        fields: [
          {
            name: '**↓Rules↓ ↑Link to Resources↑**',
            value: '<#189585230972190720>',
            inline: false,
          },
        ],
      })
    );
  },
};

export default command;
