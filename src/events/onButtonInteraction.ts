import { BotEvent } from '@/types';
import { errorEmbed, successEmbed } from '@utils/embed';

import { messageToFullId } from '@utils/guildUtils';

const event: BotEvent<'interactionCreate'> = {
  eventName: 'interactionCreate',
  skipOnDebug: false,
  processEvent: async (bot, interaction) => {
    if (!interaction.isButton()) return; // only listen to button
    const server = bot.servers[interaction.guildId || ''];
    if (!server) return;
    if (server.data.buttonRoles.messageId) {
      const interactionMessageId = messageToFullId(interaction.message);
      if (interactionMessageId === server.data.buttonRoles.messageId) {
        const buttonRole =
          server.data.buttonRoles.roles[interaction.customId]?.[0];
        if (buttonRole) {
          const member = server.guild.members.cache.get(interaction.user.id);
          if (member) {
            try {
              if (member.roles.cache.has(buttonRole)) {
                await member.roles.remove(buttonRole);
                await interaction.reply(
                  successEmbed({
                    content: `Removed <@&${buttonRole}> from you`,
                    ephemeral: true,
                  })
                );
                return;
              } else {
                await member.roles.add(buttonRole);
                await interaction.reply(
                  successEmbed({
                    content: `Added <@&${buttonRole}> to you`,
                    ephemeral: true,
                  })
                );
                return;
              }
            } catch {
              await interaction.reply(
                errorEmbed({
                  content: `The role for ${interaction.customId} does not exist. Please contact server moderators`,
                  ephemeral: true,
                })
              );

              return;
            }
          }
        }
        await interaction.reply(
          errorEmbed({
            content:
              'There was an error with the button role. Please contact server moderators.',
            ephemeral: true,
          })
        );
      }
    }
  },
};

export default event;
