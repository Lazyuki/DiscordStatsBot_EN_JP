import { TextBasedChannel, MessageReaction, User } from 'discord.js';
import { INFO_COLOR } from './constants';
import { makeEmbed } from './embed';

export async function descriptionPaginator(
  channel: TextBasedChannel,
  title: string,
  list: string[],
  perPage: number,
  authorID: string
) {
  const totalItems = list.length;
  const maxPageNum = Math.ceil(totalItems / perPage) - 1;
  let currPage = 0;

  function getEmbed() {
    let description = '';
    for (let i = 0; i < perPage; i++) {
      const actualIndex = i + currPage * perPage;
      if (actualIndex >= totalItems) break;
      description += list[actualIndex] + '\n';
    }
    return makeEmbed({
      title,
      description: description || '*empty*',
      footer: `Page: ${currPage + 1}/${maxPageNum + 1}`,
      color: '#3a8edb',
    });
  }

  const message = await channel.send(getEmbed());

  if (maxPageNum > 0) {
    await message.react('◀');
    await message.react('▶');

    const filter = (reaction: MessageReaction, user: User) =>
      reaction.me && user.id === authorID;
    const collector = message.createReactionCollector({
      filter,
      time: 60_000, // 1 mintue
    });

    collector.on('collect', (r) => {
      switch (r.emoji.name) {
        case '▶':
          if (currPage < maxPageNum) {
            ++currPage;
            message.edit(getEmbed());
          }
          r.users.remove(authorID);
          collector.empty();
          break;
        case '◀':
          if (currPage > 0) {
            --currPage;
            message.edit(getEmbed());
          }
          r.users.remove(authorID);
          collector.empty();
          break;
      }
    });
    collector.on('end', () => {
      message.reactions.removeAll();
    });
  }
}

const MAX_FIELDS = 25;
export async function fieldsPaginator(
  channel: TextBasedChannel,
  title: string,
  description: string,
  fields: { name: string; value: string }[],
  inline: boolean,
  userIndex: number,
  authorID: string
) {
  const totalItems = fields.length;
  const maxPageNum = Math.floor(totalItems / MAX_FIELDS);
  let currPage = 0;
  const userPage = Math.floor(userIndex / MAX_FIELDS);

  function getEmbed() {
    const beginIndex = currPage * MAX_FIELDS;
    return makeEmbed({
      title,
      description,
      fields: fields
        .slice(beginIndex, beginIndex + 25)
        .map((f) => ({ ...f, inline })),
      footer: `Page: ${currPage + 1}/${maxPageNum + 1}`,
      color: INFO_COLOR,
    });
  }

  const message = await channel.send(getEmbed());

  if (maxPageNum > 0) {
    await message.react('◀');
    await message.react('▶');
    if (userIndex >= 0) {
      await message.react('📍');
    }

    const filter = (reaction: MessageReaction, user: User) =>
      reaction.me && user.id === authorID;
    const collector = message.createReactionCollector({
      filter,
      time: 60_000, // 1 mintue
    });

    collector.on('collect', (r) => {
      switch (r.emoji.name) {
        case '▶':
          if (currPage < maxPageNum) {
            ++currPage;
            message.edit(getEmbed());
          }
          r.users.remove(authorID);
          collector.empty();
          break;
        case '◀':
          if (currPage > 0) {
            --currPage;
            message.edit(getEmbed());
          }
          r.users.remove(authorID);
          collector.empty();
          break;
        case '📍':
          if (currPage !== userPage) {
            currPage = userPage;
            message.edit(getEmbed());
          }
          r.users.remove(authorID);
          collector.empty();
          break;
      }
    });
    collector.on('end', () => {
      message.reactions.removeAll();
    });
  }
}
