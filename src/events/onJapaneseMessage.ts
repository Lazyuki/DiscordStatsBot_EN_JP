import { Bot, BotEvent, GuildMessage, LangType, ServerTemp } from '@/types';
import Server from '@classes/Server';
import checkLang from '@utils/checkLang';
import checkSafeMessage from '@utils/checkSafeMessage';
import { NE } from '@utils/constants';
import { getMessageTextChannel, getParentChannelId } from '@utils/guildUtils';
import { REGEX_URL } from '@utils/regex';

declare module '@/types' {
  interface ServerTemp {
    enCount: Record<string, number>;
  }
}

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  onServerInit: (server) => {
    server.temp.enCount = {};
  },
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    if (!server.config.japaneseRoles.length) return; // No Japanese on this server
    const lang = checkLang(message.content);
    const parentChannelId = getParentChannelId(message.channel);
    if (server.config.langExChannels.includes(parentChannelId)) {
      await handleLangEx(message, server, bot, lang);
    } else if (server.config.japaneseOnlyChannels.includes(parentChannelId)) {
      await japaneseOnly(message, server, bot, lang.lang);
    } else if (
      server.config.beginnerJapaneseChannels.includes(parentChannelId)
    ) {
      await checkBeginnerJapanese(message, server, bot);
    }
  },
};

const updateEvent: BotEvent<'messageUpdate'> = {
  eventName: 'messageUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMessage, newMessage) => {
    if (newMessage.partial) return;
    await createEvent.processEvent(bot, newMessage);
  },
};

async function handleLangEx(
  message: GuildMessage,
  server: Server,
  bot: Bot,
  language: { lang: LangType; escaped: boolean }
) {
  if (language.escaped) return;
  const isJapanese =
    message.member.roles.cache.hasAny(...server.config.japaneseRoles) &&
    !message.member.roles.cache.has(NE); // EJLX specific;
  if (isJapanese && language.lang === 'JP') {
    await message.react('🚫');
  } else if (!isJapanese && language.lang === 'EN') {
    await message.react('🚫');
  } else {
    const reaction = message.reactions.cache.get('🚫');
    if (reaction?.me) {
      await reaction.remove();
    }
  }
}

const geralthinkbans = [
  '395582438270566403',
  '443803648741605387',
  '443803651325034507',
  '443803653221122078',
];
async function japaneseOnly(
  message: GuildMessage,
  server: Server,
  bot: Bot,
  language: LangType
) {
  const parentChannel = getMessageTextChannel(message);
  if (!parentChannel) return;
  const key = `${parentChannel.id}${message.author.id}`;
  if (language === 'EN') {
    if (key in server.temp.enCount) {
      const enCount = ++server.temp.enCount[key];
      if (enCount > 2) {
        if (enCount <= 6) {
          const emoji = bot.emojis.cache.get(geralthinkbans[enCount - 3]);
          if (emoji) {
            await message.react(emoji);
          }
        }
        if (enCount === 5 || enCount === 6) {
          await message.channel.send(
            `${message.author.toString()} ここでは日本語を使用して下さい。Please use **only** Japanese here.`
          );
        }
        if (enCount > 6) {
          await parentChannel.permissionOverwrites.create(
            message.author,
            {
              SendMessages: false,
            },
            { reason: 'Using English in JP chat' }
          );
          await message.channel.send(
            `日本語を使わなかったため${message.author.toString()}をミュートしました。管理者のみミュート解除できます。\nYou have been muted here for not using Japanese. Contact a mod.`
          );
        }
      }
    } else {
      server.temp.enCount[key] = 1;
    }
  } else if (language === 'JP') {
    delete server.temp.enCount[key];
  }
}

const FURIGANA_PARENS_REGEX =
  /[\u4E00-\u9FAF]+[\u3040-\u309F]{0,3}(?:[(（【]|\|\|)[\u3040-\u309F]+(?:\|\||[)）】])/g;

async function checkBeginnerJapanese(
  message: GuildMessage,
  server: Server,
  bot: Bot
) {
  let content = message.content.replace(REGEX_URL, ''); // url replace
  content = content.replace(FURIGANA_PARENS_REGEX, ''); // if they put the reading in parens, its fine

  let reacted = false;
  let threshold = 2;
  for (let i = 0; i < content.length; i++) {
    let l = content[i];
    if (/[\u4E00-\u9FAF]/.test(l) && !bot.config.beginnerKanji.includes(l)) {
      --threshold;
      if (threshold <= 0 && !reacted) {
        await message.react('🔰');
        reacted = true;
      }
    }
  }
  if (!reacted) {
    for (const r of message.reactions.cache.values()) {
      if (r.me) r.remove();
    }
  }
}

export default [createEvent, updateEvent];
