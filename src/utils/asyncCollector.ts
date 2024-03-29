import { GuildMessage, GuildTextChannel, SimpleButton } from '@/types';
import Server from '@classes/Server';
import {
  ButtonStyle,
  CacheType,
  Message,
  MessageComponentInteraction,
  MessageReaction,
  NewsChannel,
  TextBasedChannel,
  TextChannel,
  User,
} from 'discord.js';
import { parseChannels } from './argumentParsers';
import { addButtons, getButtons, removeComponents } from './buttons';
import { makeEmbed } from './embed';
import { getTextChannel } from './guildUtils';

async function waitForMessage(
  channel: TextBasedChannel,
  filter: (m: Message) => boolean,
  waitForSeconds: number = 15,
  max: number = 1
): Promise<string | null> {
  const collector = channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
    max,
  });
  const promise = new Promise<string | null>((resolve) => {
    collector.on('collect', (message) => {
      resolve(message.content);
    });
    collector.on('end', () => {
      resolve(null);
    });
  });
  return promise;
}

export function waitForButton(
  buttonMessage: GuildMessage,
  filter: (option: MessageComponentInteraction<CacheType>) => boolean,
  buttons: SimpleButton[],
  waitForSeconds: number = 15
): Promise<[string, User | null]> {
  if (buttonMessage.author.id === buttonMessage.guild.members.me?.id) {
    if (!buttonMessage.components.length) {
      addButtons(buttonMessage, getButtons(buttons));
    }
  }

  const buttonCollector = buttonMessage.createMessageComponentCollector({
    filter,
    time: waitForSeconds * 1000,
  });

  const promise = new Promise<[string, User | null]>((resolve) => {
    buttonCollector.on('collect', async (interaction) => {
      await interaction.update({ components: [] });
      resolve([interaction.customId, interaction.user]);
      buttonCollector.stop();
    });
    buttonCollector.on('end', () => {
      resolve(['TIMEOUT', null]);
    });
  });
  return promise;
}

export async function waitForConfirmOrCancel(
  buttonMessage: GuildMessage,
  authorId: string,
  waitForSeconds: number = 15,
  isConfirmDestructive?: boolean
) {
  const result = await waitForMessageAndButton(
    buttonMessage,
    authorId,
    waitForSeconds,
    [
      {
        id: 'confirm',
        label: 'Confirm',
        style: isConfirmDestructive ? ButtonStyle.Danger : ButtonStyle.Primary,
      },
      { id: 'cancel', label: 'Cancel', style: ButtonStyle.Secondary },
    ],
    ['confirm', 'cancel']
  );
  return result === 'confirm';
}

const YES = ['yes', 'true', 'confirm', 'yeah', 'yea', 'y', 'はい'];
const NO = ['no', 'false', 'cancel', 'nah', 'n', 'いいえ'];
export async function waitForYesOrNo(
  buttonMessage: GuildMessage,
  authorId: string,
  waitForSeconds: number = 15
) {
  const result = await waitForMessageAndButton(
    buttonMessage,
    authorId,
    waitForSeconds,
    [
      {
        id: 'yes',
        label: 'Yes',
        style: ButtonStyle.Primary,
      },
      { id: 'no', label: 'No', style: ButtonStyle.Secondary },
    ],
    [...YES, ...NO]
  );
  return YES.includes(result);
}

export async function waitForKickConfirm(
  buttonMessage: GuildMessage,
  authorId: string,
  noReason: boolean
): Promise<'SILENT' | 'DM' | 'CANCEL'> {
  const buttons: SimpleButton[] = noReason
    ? [{ id: 'confirm', label: 'Confirm', style: ButtonStyle.Danger }]
    : [
        {
          id: 'confirm dm',
          label: 'DM',
          style: ButtonStyle.Danger,
        },
        {
          id: 'confirm silent',
          label: 'Silent',
          style: ButtonStyle.Danger,
        },
      ];
  const result = await waitForMessageAndButton(
    buttonMessage,
    authorId,
    45,
    [
      ...buttons,
      { id: 'cancel', label: 'Cancel', style: ButtonStyle.Secondary },
    ],
    noReason
      ? ['confirm', 'cancel']
      : ['confirm silent', 'confirm dm', 'confirm s', 'cancel']
  );
  if (noReason) {
    return result === 'confirm' ? 'SILENT' : 'CANCEL';
  }
  return result.startsWith('confirm s')
    ? 'SILENT'
    : result === 'confirm dm'
    ? 'DM'
    : 'CANCEL';
}

export async function waitForBanConfirm(
  buttonMessage: GuildMessage,
  authorId: string,
  allowDelete: boolean
): Promise<'DELETE' | 'KEEP' | 'CANCEL' | 'TIMEOUT'> {
  const buttons: SimpleButton[] = allowDelete
    ? [{ id: 'confirm delete', label: 'DELETE', style: ButtonStyle.Danger }]
    : [];
  const deleteMessages = allowDelete
    ? ['confirm delete', 'confirm del', 'confirm d']
    : [];

  const result = await waitForMessageAndButton(
    buttonMessage,
    authorId,
    45,
    [
      ...buttons,
      { id: 'confirm keep', label: 'KEEP', style: ButtonStyle.Danger },
      { id: 'cancel', label: 'Cancel', style: ButtonStyle.Secondary },
    ],
    [...deleteMessages, 'confirm keep', 'confirm k', 'cancel']
  );
  if (result.startsWith('confirm d')) {
    return 'DELETE';
  } else if (result.startsWith('confirm k')) {
    return 'KEEP';
  } else if (result === 'cancel') {
    return 'CANCEL';
  } else {
    return 'TIMEOUT';
  }
}

export async function getFallbackChannel(
  buttonMessage: GuildMessage,
  authorId: string,
  server: Server,
  waitForSeconds: number = 60
) {
  const yes = await waitForYesOrNo(buttonMessage, authorId, waitForSeconds);
  if (!yes) return null;
  if (server.config.userDMFallbackChannel) {
    return getTextChannel(server.guild, server.config.userDMFallbackChannel);
  }
  await buttonMessage.channel.send(
    makeEmbed({
      color: 'Purple',
      description: `Please specify the channel. Make sure they have access to the channel.`,
    })
  );
  const filter = (m: Message) =>
    m.author.id === authorId && m.mentions.channels.size > 0;
  const collector = buttonMessage.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<GuildTextChannel | null>((resolve) => {
    collector.on('collect', (m) => {
      const { textChannels } = parseChannels(m.content, server.guild);
      if (textChannels.length) {
        resolve(textChannels[0]);
      }
    });
    collector.on('end', () => {
      resolve(null);
    });
  });
  return promise;
}

// Retruns one of allowed messages, one of buttons' IDs, or "timeout"
export function waitForMessageAndButton(
  buttonMessage: GuildMessage,
  authorId: string,
  waitForSeconds: number,
  buttons: SimpleButton[],
  allowedMessages: string[]
): Promise<string> {
  const filter = (m: Message) =>
    m.author.id === authorId &&
    allowedMessages.includes(m.content.toLowerCase());

  const messageCollector = buttonMessage.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  if (buttonMessage.author.id === buttonMessage.guild.members.me?.id) {
    if (!buttonMessage.components.length) {
      addButtons(buttonMessage, getButtons(buttons));
    }
  }
  const buttonCollector = buttonMessage.createMessageComponentCollector({
    filter: (componentOption) => componentOption.user.id === authorId,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<string>((resolve) => {
    messageCollector.on('collect', (message) => {
      resolve(message.content.toLowerCase());
      messageCollector.stop();
      buttonCollector.stop();
    });
    buttonCollector.on('collect', async (interaction) => {
      await interaction.update({ components: [] });
      resolve(interaction.customId);
      messageCollector.stop();
      buttonCollector.stop();
    });
    messageCollector.on('end', () => {
      removeComponents(buttonMessage);
      resolve('timeout');
    });
  });
  return promise;
}

export async function waitForReactions(
  message: Message,
  reactions: { emojiOrId: string; count: number }[],
  waitForSeconds = 60
) {
  const emojiOrIds = reactions.map((r) => r.emojiOrId);
  const filter = (reaction: MessageReaction) =>
    reaction.emoji.id
      ? emojiOrIds.includes(reaction.emoji.id)
      : emojiOrIds.includes(reaction.emoji.name || '');

  const counts: Record<string, number> = {};
  const collector = message.createReactionCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<{ emojiOrId: string; user: User } | null>(
    (resolve) => {
      collector.on('collect', async (r, u) => {
        const collectedReaction = reactions.find((reaction) =>
          r.emoji.id
            ? reaction.emojiOrId === r.emoji.id
            : reaction.emojiOrId === r.emoji.name
        );
        if (!collectedReaction) return; // shouldn't be possible
        const requiredCount = collectedReaction.count;
        if (requiredCount === 1) {
          resolve({ emojiOrId: collectedReaction.emojiOrId, user: u });
        } else {
          const key = `${collectedReaction.emojiOrId}${u.id}`;
          key in counts ? counts[key]++ : (counts[key] = 1);
          if (counts[key] >= requiredCount) {
            resolve({ emojiOrId: collectedReaction.emojiOrId, user: u });
          }
        }
      });
      collector.on('end', () => {
        message.reactions.removeAll();
        resolve(null);
      });
    }
  );
  return promise;
}
