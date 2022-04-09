import { BotEvent } from '@/types';
import { EJLX, EJLX_LANG_ROLE_IDS, JHO } from '@utils/constants';
import { errorEmbed, successEmbed, warningEmbed } from '@utils/embed';

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
                    description: `**Removed** <@&${buttonRole}> from you`,
                    ephemeral: true,
                  })
                );
                return;
              } else {
                const isHardcore = buttonRole === server.config.hardcoreRole;
                if (interaction.guildId === EJLX) {
                  if (
                    isHardcore &&
                    !member.roles.cache.hasAny(...EJLX_LANG_ROLE_IDS)
                  ) {
                    await interaction.reply(
                      errorEmbed({
                        description: `Please state your native language in <#${JHO}> first.`,
                        ephemeral: true,
                      })
                    );
                    return;
                  }
                }
                await member.roles.add(buttonRole);
                if (isHardcore) {
                  const isJapanese = member.roles.cache.hasAny(
                    ...server.config.japaneseRoles
                  );
                  await interaction.reply(
                    warningEmbed({
                      description: `**Added** <@&${buttonRole}> to you.\n\n**You will NOT be able to send messages in ${
                        isJapanese ? 'Japanese' : 'English'
                      }**`,
                      ephemeral: true,
                    })
                  );
                } else {
                  await interaction.reply(
                    successEmbed({
                      description: `**Added** <@&${buttonRole}> to you`,
                      ephemeral: true,
                    })
                  );
                }
                return;
              }
            } catch {
              await interaction.reply(
                errorEmbed({
                  description: `The role for ${interaction.customId} does not exist. Please contact server moderators`,
                  ephemeral: true,
                })
              );

              return;
            }
          }
        }
        await interaction.reply(
          errorEmbed({
            description:
              'There was an error with the button role. Please contact server moderators.',
            ephemeral: true,
          })
        );
      }
    }
  },
};

export default event;
