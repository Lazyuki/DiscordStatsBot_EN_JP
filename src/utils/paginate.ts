import { TextBasedChannel, MessageReaction, User } from 'discord.js';
import { makeEmbed } from './embed';

async function paginate(
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

export default paginate;
