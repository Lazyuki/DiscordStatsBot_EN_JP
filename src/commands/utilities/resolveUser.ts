import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { removeComponents } from '@utils/buttons';
import { getUserDropdown } from '@utils/dropdowns';
import { editEmbed, errorEmbed, makeEmbed } from '@utils/embed';
import { userToMentionAndTag } from '@utils/formatString';
import { getTextChannel } from '@utils/guildUtils';
import { GuildMember } from 'discord.js';

const REGEX_USER_TAG_WITH_LAST_PART = /\S+#[0-9]{4}/g;

const command: BotCommand = {
  name: 'resolveUser',
  aliases: ['ru', 'getuser', 'find'],
  description:
    'Reply to a message or provide a Discord user tag (e.g. Geralt#0007) and try to get the user info. ',
  examples: [['ru', '(While replying to a message)'], 'ru Geralt#0007'],
  normalCommand: async ({ message, content, server }) => {
    const tags: string[] = [];
    if (message.reference) {
      // Message reply
      const channel = getTextChannel(server.guild, message.reference.channelId);
      if (!channel || !message.reference.messageId) {
        throw new CommandArgumentError('Impossible message reference');
      }
      const sourceMessage = await channel.messages.fetch(
        message.reference.messageId
      );
      const match = sourceMessage.content.match(REGEX_USER_TAG_WITH_LAST_PART);
      if (match) {
        tags.push(...match);
      }
    } else if (content) {
      if (/.*#[0-9]{4}$/.test(content)) {
        // all of content is user tag
        tags.push(content);
      } else {
        const match = content.match(REGEX_USER_TAG_WITH_LAST_PART);
        if (match) {
          tags.push(...match);
        }
      }
    }
    if (tags.length === 0) {
      throw new CommandArgumentError(
        'Could not find any user tags in the format XXXX#0000.'
      );
    }
    const members: GuildMember[] = [];
    server.guild.members.cache.forEach((member) => {
      const tag = member.user.tag.toLowerCase();
      if (
        tags.some(
          (t) => t.toLowerCase() === tag || tag.endsWith(' ' + t.toLowerCase())
        )
      ) {
        members.push(member);
      }
    });
    if (members.length === 0) {
      await message.channel.send(
        errorEmbed('The user tags did not match anyone')
      );
      return;
    }
    if (members.length === 1) {
      const member = members[0];
      await message.channel.send(
        makeEmbed({
          content: member.id,
          authorIcon: member.displayAvatarURL(),
          authorName: member.user.tag,
        })
      );
    } else {
      function createMessage(selectedMemberId?: string) {
        return {
          ...makeEmbed({
            content: selectedMemberId || undefined,
            title: `Matched multiple members`,
            description: members
              .map(
                (m) =>
                  `${
                    m.id === selectedMemberId ? '➡️' : ''
                  }${userToMentionAndTag(m.user)}`
              )
              .join('\n'),
            footer: `Select one from the dropdown to get the ID`,
          }),
          components: getUserDropdown(members),
        };
      }
      const resultsMessage = await message.channel.send(createMessage());
      const dropdownCollector = resultsMessage.createMessageComponentCollector({
        time: 180 * 1000,
      });
      dropdownCollector.on('collect', async (interaction) => {
        if (!interaction.isSelectMenu()) return;
        if (interaction.user.id === message.author.id) {
          await interaction.update(createMessage(interaction.values[0]));
        } else {
          const id = interaction.values[0];
          const member = members.find((m) => m.id === id)!;
          await interaction.reply(
            makeEmbed({
              content: id,
              description: `You selected ${member} (${member.user.tag})`,
            })
          );
        }
      });
      dropdownCollector.on('end', () => {
        removeComponents(resultsMessage);
        editEmbed(resultsMessage, { footer: 'Selection closed' });
      });
    }
  },
};

export default command;
