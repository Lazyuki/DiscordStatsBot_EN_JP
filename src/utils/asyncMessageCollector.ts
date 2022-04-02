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
import { infoEmbed, makeEmbed } from './embed';
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
  message: GuildMessage,
  waitForSeconds: number = 15
): Promise<boolean> {
  const filter = (m: Message) =>
    m.author.id === message.author.id &&
    ['confirm', 'cancel'].includes(m.content.trim().toLowerCase());
  const collector = message.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<boolean>((resolve) => {
    collector.on('collect', (message) => {
      resolve(message.content === 'confirm');
    });
    collector.on('end', () => {
      resolve(false);
    });
  });
  return promise;
}

const YES = ['yes', 'true', 'confirm', 'yeah', 'yea', 'y', 'はい'];
const NO = ['no', 'false', 'cancel', 'nah', 'n', 'いいえ'];

// Like waitForConfirmOrCancel but can accept more natural responses. Do not use for risky operations like memebr bans.
export function waitForYesOrNo(
  message: GuildMessage,
  waitForSeconds: number = 15
): Promise<boolean> {
  const filter = (m: Message) =>
    m.author.id === message.author.id &&
    [...YES, ...NO].includes(m.content.toLowerCase());
  const collector = message.channel.createMessageCollector({
    filter,
    time: waitForSeconds * 1000,
  });
  const promise = new Promise<boolean>((resolve) => {
    collector.on('collect', (message) => {
      resolve(YES.includes(message.content));
    });
    collector.on('end', () => {
      resolve(false);
    });
  });
  return promise;
}

export async function getFallbackChannel(
  message: GuildMessage,
  server: Server,
  waitForSeconds: number = 30
) {
  const yes = await waitForYesOrNo(message, waitForSeconds);
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
