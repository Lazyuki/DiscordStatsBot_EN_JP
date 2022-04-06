import { GuildMessage } from '@/types';
import Server from '@classes/Server';
import {
  Emoji,
  GuildMember,
  Message,
  MessageReaction,
  NewsChannel,
  TextBasedChannel,
  TextChannel,
  User,
} from 'discord.js';
import { parseChannels } from './argumentParsers';
import {
  addButtons,
  getConfirmOrCancelButtons,
  getYesOrNoButtons,
  removeButtons,
} from './buttons';
import { errorEmbed, infoEmbed, makeEmbed } from './embed';
import { getTextChannel } from './guildUtils';
import { REGEX_CHAN } from './regex';

async function asyncMessageCollector(
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
  const promise = new Promise<string | null>((resolve, reject) => {
    collector.on('collect', (message) => {
      resolve(message.content);
    });
    collector.on('end', () => {
      resolve(null);
    });
  });
  return promise;
}

export function waitForConfirmOrCancel(
  butonMessage: GuildMessage,
  authorId: string,
  waitForSeconds: number = 15
): Promise<boolean> {
  const filter = (m: Message) =>
    m.author.id === authorId &&
    ['confirm', 'cancel'].includes(m.content.trim().toLowerCase());
  const messageCollector = butonMessage.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  if (butonMessage.author.id === butonMessage.guild.me?.id) {
    if (!butonMessage.components.length) {
      addButtons(butonMessage, getConfirmOrCancelButtons());
    }
  }
  const buttonCollector = butonMessage.createMessageComponentCollector({
    filter: (componentOption) => componentOption.user.id === authorId,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<boolean>((resolve) => {
    messageCollector.on('collect', (message) => {
      buttonCollector.stop();
      resolve(message.content === 'confirm');
    });
    buttonCollector.on('collect', async (interaction) => {
      await interaction.update({ components: [] });
      if (interaction.customId === 'CONFIRM') {
        resolve(true);
      } else if (interaction.customId === 'CANCEL') {
        resolve(false);
      }
    });
    buttonCollector.on('end', () => {
      removeButtons(butonMessage);
      messageCollector.stop();
    });
    messageCollector.on('end', () => {
      buttonCollector.stop();
      resolve(false);
    });
  });
  return promise;
}

const YES = ['yes', 'true', 'confirm', 'yeah', 'yea', 'y', 'はい'];
const NO = ['no', 'false', 'cancel', 'nah', 'n', 'いいえ'];

// Like waitForConfirmOrCancel but can accept more natural responses. Do not use for risky operations like memebr bans.
export function waitForYesOrNo(
  butonMessage: GuildMessage,
  authorId: string,
  waitForSeconds: number = 15
): Promise<boolean> {
  const filter = (m: Message) =>
    m.author.id === authorId &&
    [...YES, ...NO].includes(m.content.toLowerCase());
  const messageCollector = butonMessage.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  if (butonMessage.author.id === butonMessage.guild.me?.id) {
    if (!butonMessage.components.length) {
      addButtons(butonMessage, getYesOrNoButtons());
    }
  }
  const buttonCollector = butonMessage.createMessageComponentCollector({
    filter: (componentOption) => componentOption.user.id === authorId,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<boolean>((resolve) => {
    messageCollector.on('collect', (message) => {
      buttonCollector.stop();
      resolve(YES.includes(message.content));
    });
    buttonCollector.on('collect', async (interaction) => {
      await interaction.update({ components: [] });
      if (interaction.customId === 'YES') {
        resolve(true);
      } else if (interaction.customId === 'NO') {
        resolve(false);
      }
    });
    buttonCollector.on('end', () => {
      removeButtons(butonMessage);
      messageCollector.stop();
    });
    messageCollector.on('end', () => {
      buttonCollector.stop();
      resolve(false);
    });
  });
  return promise;
}

export async function getFallbackChannel(
  message: GuildMessage,
  server: Server,
  waitForSeconds: number = 60
) {
  const yes = await waitForYesOrNo(message, message.author.id, waitForSeconds);
  if (!yes) return null;
  if (server.config.userDMFallbackChannel) {
    return getTextChannel(server.guild, server.config.userDMFallbackChannel);
  }
  await message.channel.send(
    makeEmbed({
      color: 'PURPLE',
      description: `Please specify the channel. Make sure they have access to the channel.`,
    })
  );
  const filter = (m: Message) =>
    m.author.id === message.author.id && m.mentions.channels.size > 0;
  const collector = message.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<TextChannel | NewsChannel | null>((resolve) => {
    collector.on('collect', (m) => {
      const { channels } = parseChannels(m.content, server.guild);
      if (channels.length) {
        resolve(channels[0]);
      }
    });
    collector.on('end', () => {
      resolve(null);
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
