import { SimpleButton } from '@/types';
import {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  MessageCreateOptions,
  ButtonStyle,
} from 'discord.js';
import { REGEX_CUSTOM_EMOTES } from './regex';

const FIRST_PAGE = '⏮';
const PREVIOUS_PAGE = '◀️';
const NEXT_PAGE = '▶️';
const LAST_PAGE = '⏭';
const PINNED_PAGE = '📍';

export function getPaginatorButtons(
  pages: number,
  currentPage: number,
  hasPin: boolean
) {
  if (pages <= 1) {
    return undefined;
  }
  const shouldHaveSkip = pages > 3;
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (shouldHaveSkip) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('FIRST_PAGE')
        .setLabel(FIRST_PAGE)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0)
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('PREVIOUS_PAGE')
      .setLabel(PREVIOUS_PAGE)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0)
  );
  if (hasPin) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('PINNED_PAGE')
        .setLabel(PINNED_PAGE)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('NEXT_PAGE')
      .setLabel(NEXT_PAGE)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === pages - 1)
  );
  if (shouldHaveSkip) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('LAST_PAGE')
        .setLabel(LAST_PAGE)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === pages - 1)
    );
  }
  return [row];
}

export function getYesOrNoButtons() {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('YES')
      .setLabel('Yes')
      .setStyle(ButtonStyle.Primary)
  );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('NO')
      .setLabel('No')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

export function getButtons(buttons: SimpleButton[]) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  buttons.forEach((button) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(button.id)
        .setLabel(button.label)
        .setStyle(button.style)
    );
  });
  return [row];
}

export function getConfirmOrCancelButtons(isConfirmDestructive?: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('CONFIRM')
      .setLabel('Confirm')
      .setStyle(isConfirmDestructive ? ButtonStyle.Danger : ButtonStyle.Primary)
  );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('CANCEL')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

export function getBanOrDismiss() {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('BAN')
      .setLabel('BAN')
      .setStyle(ButtonStyle.Danger)
  );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('Dismiss')
      .setLabel('Dismiss')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

export function getBanConfirmationButtons(allowDelete: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>();

  if (allowDelete) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('confirm delete')
        .setLabel('DELETE')
        .setStyle(ButtonStyle.Danger)
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('confirm keep')
      .setLabel('KEEP')
      .setStyle(ButtonStyle.Danger)
  );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

export async function removeComponents(message: Message) {
  if (message.components) {
    await message.edit({
      content: message.content || undefined,
      embeds: message.embeds,
      components: [],
    });
  }
}

export async function addButtons(
  message: Message,
  components: MessageCreateOptions['components']
) {
  await message.edit({
    content: message.content || undefined,
    embeds: message.embeds,
    components,
  });
}

export function getButtonsWithLabels(labels: string[]) {
  let colCount = 0;
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currRow = new ActionRowBuilder<ButtonBuilder>();
  labels.forEach((label) => {
    if (colCount === 5) {
      rows.push(currRow);
      currRow = new ActionRowBuilder<ButtonBuilder>();
    }
    const discordEmoji = label.match(REGEX_CUSTOM_EMOTES)?.[0];
    const button = new ButtonBuilder()
      .setCustomId(label)
      .setStyle(ButtonStyle.Secondary);
    if (discordEmoji) {
      button.setEmoji(discordEmoji);
      label = label.replace(REGEX_CUSTOM_EMOTES, '').trim();
      if (label) {
        button.setLabel(label);
      }
    } else {
      button.setLabel(label);
    }
    currRow.addComponents(button);
  });
  rows.push(currRow);
  return rows;
}

export function getButtonsTest(labels: string[]) {
  let colCount = 0;
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currRow = new ActionRowBuilder<ButtonBuilder>();
  labels.forEach((label) => {
    if (colCount === 5) {
      rows.push(currRow);
      currRow = new ActionRowBuilder<ButtonBuilder>();
    }
    const discordEmoji = label.match(REGEX_CUSTOM_EMOTES)?.[0];
    const button = new ButtonBuilder()
      .setCustomId(label)
      .setStyle(ButtonStyle.Secondary);
    if (discordEmoji) {
      button.setEmoji(discordEmoji);
      //   label = label.replace(REGEX_CUSTOM_EMOTES, '');
      if (label) {
        button.setLabel(label);
      }
    } else {
      button.setLabel(label);
    }

    currRow.addComponents(button);
  });
  rows.push(currRow);
  return rows;
}
