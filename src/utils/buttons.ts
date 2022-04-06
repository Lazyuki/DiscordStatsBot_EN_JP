import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageOptions,
} from 'discord.js';

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

export function getBanConfirmationButtons(allowDelete: boolean) {
  const row = new MessageActionRow();

  if (allowDelete) {
    row.addComponents(
      new MessageButton()
        .setCustomId('DELETE')
        .setLabel('DELETE')
        .setStyle('DANGER')
    );
  }
  row.addComponents(
    new MessageButton().setCustomId('KEEP').setLabel('KEEP').setStyle('DANGER')
  );
  row.addComponents(
    new MessageButton()
      .setCustomId('CANCEL')
      .setLabel('Cancel')
      .setStyle('SECONDARY')
  );
  return [row];
}

export async function removeButtons(message: Message) {
  await message.edit({
    content: message.content || undefined,
    embeds: message.embeds,
    components: [],
  });
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
