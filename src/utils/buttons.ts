import { SimpleButton } from '@/types';
import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageOptions,
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
  const row = new MessageActionRow();
  if (shouldHaveSkip) {
    row.addComponents(
      new MessageButton()
        .setCustomId('FIRST_PAGE')
        .setLabel(FIRST_PAGE)
        .setStyle('SECONDARY')
        .setDisabled(currentPage === 0)
    );
  }
  row.addComponents(
    new MessageButton()
      .setCustomId('PREVIOUS_PAGE')
      .setLabel(PREVIOUS_PAGE)
      .setStyle('SECONDARY')
      .setDisabled(currentPage === 0)
  );
  if (hasPin) {
    row.addComponents(
      new MessageButton()
        .setCustomId('PINNED_PAGE')
        .setLabel(PINNED_PAGE)
        .setStyle('SECONDARY')
    );
  }
  row.addComponents(
    new MessageButton()
      .setCustomId('NEXT_PAGE')
      .setLabel(NEXT_PAGE)
      .setStyle('SECONDARY')
      .setDisabled(currentPage === pages - 1)
  );
  if (shouldHaveSkip) {
    row.addComponents(
      new MessageButton()
        .setCustomId('LAST_PAGE')
        .setLabel(LAST_PAGE)
        .setStyle('SECONDARY')
        .setDisabled(currentPage === pages - 1)
    );
  }
  return [row];
}

export function getYesOrNoButtons() {
  const row = new MessageActionRow();
  row.addComponents(
    new MessageButton().setCustomId('YES').setLabel('Yes').setStyle('PRIMARY')
  );
  row.addComponents(
    new MessageButton().setCustomId('NO').setLabel('No').setStyle('SECONDARY')
  );
  return [row];
}

export function getButtons(buttons: SimpleButton[]) {
  const row = new MessageActionRow();
  buttons.forEach((button) => {
    row.addComponents(
      new MessageButton()
        .setCustomId(button.id)
        .setLabel(button.label)
        .setStyle(button.style)
    );
  });
  return [row];
}

export function getConfirmOrCancelButtons(isConfirmDestructive?: boolean) {
  const row = new MessageActionRow();
  row.addComponents(
    new MessageButton()
      .setCustomId('CONFIRM')
      .setLabel('Confirm')
      .setStyle(isConfirmDestructive ? 'DANGER' : 'PRIMARY')
  );
  row.addComponents(
    new MessageButton()
      .setCustomId('CANCEL')
      .setLabel('Cancel')
      .setStyle('SECONDARY')
  );
  return [row];
}

export function getBanOrDismiss() {
  const row = new MessageActionRow();
  row.addComponents(
    new MessageButton().setCustomId('BAN').setLabel('BAN').setStyle('DANGER')
  );
  row.addComponents(
    new MessageButton()
      .setCustomId('Dismiss')
      .setLabel('Dismiss')
      .setStyle('SECONDARY')
  );
  return [row];
}

export function getBanConfirmationButtons(allowDelete: boolean) {
  const row = new MessageActionRow();

  if (allowDelete) {
    row.addComponents(
      new MessageButton()
        .setCustomId('confirm delete')
        .setLabel('DELETE')
        .setStyle('DANGER')
    );
  }
  row.addComponents(
    new MessageButton()
      .setCustomId('confirm keep')
      .setLabel('KEEP')
      .setStyle('DANGER')
  );
  row.addComponents(
    new MessageButton()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle('SECONDARY')
  );
  return [row];
}

export async function removeButtons(message: Message) {
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
  components: MessageOptions['components']
) {
  await message.edit({
    content: message.content || undefined,
    embeds: message.embeds,
    components,
  });
}

export function getButtonsWithLabels(labels: string[]) {
  let colCount = 0;
  const rows: MessageActionRow[] = [];
  let currRow = new MessageActionRow();
  labels.forEach((label) => {
    if (colCount === 5) {
      rows.push(currRow);
      currRow = new MessageActionRow();
    }
    const discordEmoji = label.match(REGEX_CUSTOM_EMOTES)?.[0];
    const button = new MessageButton().setCustomId(label).setStyle('SECONDARY');
    discordEmoji ? button.setEmoji(discordEmoji) : button.setLabel(label);

    currRow.addComponents(button);
  });
  rows.push(currRow);
  return rows;
}
