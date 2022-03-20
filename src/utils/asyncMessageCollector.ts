import { GuildMessage } from '@/types';
import { GuildMember, Message, TextBasedChannel } from 'discord.js';

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
  message: GuildMessage<Message>,
  waitForSeconds: number = 15
): Promise<boolean> {
  const filter = (m: Message) =>
    m.author.id === message.author.id &&
    ['confirm', 'cancel'].includes(m.content.toLowerCase());
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
  message: GuildMessage<Message>,
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
