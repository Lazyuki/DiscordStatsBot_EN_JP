import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import { makeEmbed } from '@utils/embed';
import { stripIndent } from 'common-tags';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'translation',
  aliases: ['tl'],
  allowedServers: [EJLX],
  description: 'Explain why translation requests are not allowed',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        color: '#FF5500',
        description: stripIndent`
        This is not a translation server, we do not allow translation requests. If you have an attempt of your own that you wish to have corrected you may go ahead, but please do not attempt to solicit free translations.
        ここは翻訳のサーバーではありません。私たちは翻訳のリクエストを受け付けていません。まずは自分で翻訳し、添削を依頼することは可能ですが、翻訳依頼はやめてください。
        Try https://reddit.com/r/translator or https://www.deepl.com/. For images, Google Translate has an option to translate from images
        `,
      })
    );
  },
};

export default command;
