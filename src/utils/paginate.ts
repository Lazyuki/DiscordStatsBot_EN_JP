import { TextBasedChannel } from 'discord.js';
import { getPaginatorButtons } from './buttons';
import { INFO_COLOR } from './constants';
import {
  EmbedField,
  makeEmbed,
  MAX_FIELDS,
  splitFieldsIntoPages,
} from './embed';

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

  function getEmbed(page: number, end?: boolean) {
    let description = '';
    for (let i = 0; i < perPage; i++) {
      const actualIndex = i + page * perPage;
      if (actualIndex >= totalItems) break;
      description += list[actualIndex] + '\n';
    }
    return {
      ...makeEmbed({
        title,
        description: description || '*empty*',
        footer: `Page: ${page + 1}/${maxPageNum + 1}`,
        color: '#3a8edb',
      }),
      components: end ? [] : getPaginatorButtons(maxPageNum, page, false),
    };
  }

  const message = await channel.send(getEmbed(currPage));

  if (maxPageNum > 0) {
    const collector = message.createMessageComponentCollector({
      filter: (componentOption) => componentOption.user.id === authorID,
      time: 60_000, // 1 mintue
    });

    collector.on('collect', async (interaction) => {
      switch (interaction.customId) {
        case 'FIRST_PAGE':
          if (currPage !== 0) {
            currPage = 0;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'PREVIOUS_PAGE':
          if (currPage > 0) {
            --currPage;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'NEXT_PAGE':
          if (currPage < maxPageNum) {
            ++currPage;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'LAST_PAGE':
          if (currPage !== maxPageNum) {
            currPage = maxPageNum;
            await interaction.update(getEmbed(currPage));
          }
          break;
      }
    });
    collector.on('end', () => {
      message.edit(getEmbed(currPage, true));
    });
  }
}

export async function fieldsPaginator(
  channel: TextBasedChannel,
  title: string,
  description: string,
  fields: EmbedField[],
  inline: boolean,
  userIndex: number,
  authorID: string
) {
  const pages = splitFieldsIntoPages(
    fields,
    title.length + description.length + 'Page: 9999/9999'.length
  );
  const maxPageIndex = pages.length - 1;
  let currPage = 0;
  const userPage = Math.floor(userIndex / MAX_FIELDS); // TODO: search pages

  function getEmbed(page: number, end?: boolean) {
    return {
      ...makeEmbed({
        title,
        description,
        fields: pages[page]?.fields.map((f) => ({ ...f, inline })),
        footer: `Page: ${page + 1}/${maxPageIndex + 1}`,
        color: INFO_COLOR,
      }),
      components: end
        ? []
        : getPaginatorButtons(pages.length, currPage, userIndex >= 0),
    };
  }

  const message = await channel.send(getEmbed(currPage));

  if (maxPageIndex > 0) {
    // Don't await to speed it up
    const collector = message.createMessageComponentCollector({
      filter: (componentOption) => componentOption.user.id === authorID,
      time: 60_000, // 1 mintue
    });

    collector.on('collect', async (interaction) => {
      switch (interaction.customId) {
        case 'FIRST_PAGE':
          if (currPage !== 0) {
            currPage = 0;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'PREVIOUS_PAGE':
          if (currPage > 0) {
            --currPage;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'PINNED_PAGE':
          if (currPage !== userPage) {
            currPage = userPage;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'NEXT_PAGE':
          if (currPage < maxPageIndex) {
            ++currPage;
            await interaction.update(getEmbed(currPage));
          }
          break;
        case 'LAST_PAGE':
          if (currPage !== maxPageIndex) {
            currPage = maxPageIndex;
            await interaction.update(getEmbed(currPage));
          }
          break;
      }
    });
    collector.on('end', () => {
      message.edit(getEmbed(currPage, true));
    });
  }
}
