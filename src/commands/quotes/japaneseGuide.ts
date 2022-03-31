import { MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { EJLX, EXTERNAL_LINK_EMOJI, FJ_COLOR } from '@utils/constants';
import { EmbedField, infoEmbed, makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'japaneseGuide',
  aliases: ['guide', 'g'],
  allowedServers: [EJLX],
  description: 'Japanese learning guide',
  arguments:
    '[ beginner | kana | kanji | grammar | vocab | IME | dictionary | anki | pronunciation | learn ]',
  rateLimitSeconds: 1,
  normalCommand: async ({ message, content }) => {
    content = content.toLowerCase();
    let title;
    let description;
    let url;
    let fields: EmbedField[] = [];
    switch (content) {
      case 'beginner':
      case 'guides': {
        title = `__**Guides ${EXTERNAL_LINK_EMOJI}**__`;
        description = 'All beginners should read one of the below guides';
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#beginner-guide';
        fields = [
          {
            name: "r/LearnJapanese's guide",
            value:
              'https://www.reddit.com/r/LearnJapanese/wiki/index/startersguide',
          },
          {
            name: 'A well written DJT guide',
            value: 'https://djtguide.neocities.org/guide.html',
          },
          {
            name: 'Guide for beginners written by Bonyari Boy',
            value:
              'https://docs.google.com/document/d/19FEIOJWbLhJQ-AmepxFBMC2ebhJJr9RBUMfMeatYuq8/edit?usp=sharing',
          },
        ];
        break;
      }
      case 'kana':
      case 'hiragana':
      case 'katakana': {
        title = `__**Kana ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#hiragana-and-katakana';
        description = 'The first step is learning Hiragana and Katakana. ';
        fields = [
          {
            name: 'Tofugu Hiragana guide',
            value: 'https://www.tofugu.com/japanese/learn-hiragana/',
          },
          {
            name: 'Tofugu Katakana guide',
            value: 'https://www.tofugu.com/japanese/learn-katakana/',
          },
        ];
        break;
      }
      case 'kanji': {
        title = `__**Kanji ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#kanji';
        description = "After you've got your kana down, you need Kanji.";
        fields = [
          {
            name: 'Anki decks',
            value: 'https://djtguide.neocities.org/anki.html',
            inline: true,
          },
          {
            name: 'Wanikani ($)',
            value: 'https://www.wanikani.com/',
            inline: true,
          },
          {
            name: 'Kanji Koohi',
            value: 'https://kanji.koohii.com/',
            inline: true,
          },
          {
            name: 'Kanji Damage',
            value: 'http://www.kanjidamage.com/introduction',
            inline: true,
          },
        ];
        break;
      }
      case 'grammar': {
        title = `__**Grammar ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#grammar';
        description =
          'You can either use a structured textbook or a more free-form online grammar guide like Tae-Kim. Either one works, try one or both and stick with the one you like the best.';
        fields = [
          {
            name: 'Genki: Beginner textbook',
            value: 'http://genki.japantimes.co.jp/index_en',
          },
          {
            name: 'Tobira: Intermediate textbook',
            value: 'http://tobiraweb.9640.jp/',
          },
          {
            name: 'Tae-Kim: Online guide',
            value: 'http://www.guidetojapanese.org/learn/grammar',
          },
        ];
        break;
      }
      case 'vocab': {
        title = `__**Vocabulary ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#vocabulary';
        description = 'For vocabulary, three nice options are: ';
        fields = [
          {
            name: 'Wanikani ($)',
            value: 'https://www.wanikani.com/',
            inline: true,
          },
          { name: 'Memrise', value: 'https://www.memrise.com/', inline: true },
          { name: 'Anki', value: 'http://ankisrs.net/', inline: true },
        ];
      }
      case 'ime':
      case 'type':
      case 'keyboard': {
        title = `__**Keyboard ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#software';
        description =
          'You need to have a special program (IME) to type in Japanese';
        fields = [
          {
            name: 'Installing a Japanese Keyboard',
            value:
              'https://www.tofugu.com/japanese/how-to-install-japanese-keyboard/',
          },
          {
            name: 'Typing Guide',
            value: 'https://www.tofugu.com/japanese/how-to-type-in-japanese/',
          },
        ];
      }
      case 'dict':
      case 'dictionary':
      case 'dictionaries': {
        title = `__**Dictionaries ${EXTERNAL_LINK_EMOJI}**__`;
        url =
          'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#dictionary';
        description =
          'For translating, avoid using Google Translate. Instead use one of these:';
        fields = [
          { name: 'Jisho.org', value: 'http://jisho.org/', inline: true },
          { name: 'Tangorin', value: 'http://tangorin.com/', inline: true },
          { name: 'Weblio', value: 'http://www.weblio.jp/', inline: true },
        ];
      }
      case 'anki': {
        title = `__**Anki ${EXTERNAL_LINK_EMOJI}**__`;
        url = 'https://itazuraneko.neocities.org/learn/anki.html';
        description =
          'Anki is a free and open-source flashcard program that utilizes spaced repetition.';
      }
      case 'audio':
      case 'pronunciation': {
        title = `__**Pronunciation**__`;
        description = 'Look up pronunciations';
        fields = [
          {
            name: 'Forvo: Pronunciation audio examples given by native speakers',
            value: 'https://forvo.com/languages/ja/',
            inline: true,
          },
          {
            name: 'YouGlish: Search YouTube videos for instances of words',
            value: 'https://youglish.com/japanese',
            inline: true,
          },
        ];
      }
      case 'bon':
      case 'bonyari':
      case 'learn': {
        title = `**How to learn Japanese efficiently** ${EXTERNAL_LINK_EMOJI}`;
        url =
          'https://docs.google.com/document/d/19FEIOJWbLhJQ-AmepxFBMC2ebhJJr9RBUMfMeatYuq8/edit?usp=sharing';
        description = `Written by Bonyari Boy`;
      }
      case '': {
        description = `__**[New to Japanese? Start here! ${EXTERNAL_LINK_EMOJI}](https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#beginner-guide)**__`;
        break;
      }
      default: {
      }
    }
    await message.channel.send(
      infoEmbed({
        title,
        titleUrl: url,
        description,
        fields,
      })
    );
  },
};

export default command;
