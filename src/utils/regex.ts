import emojiRegex from 'emoji-regex';
// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
export const REGEX_JPN = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
export const REGEX_ENG = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
export const REGEX_URL = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;

export const REGEX_UNICODE_EMOJI = emojiRegex();
export const REGEX_CUSTOM_EMOTES = /(<a?:[^:]+:[0-9]+>)/g;
export const REGEX_USER = /<@!?[0-9]+>/g;
export const REGEX_USER_TAG = /(\S+#[0-9]{4})/g;
export const REGEX_CHAN = /<#[0-9]+>/g;
export const REGEX_ROLE = /<@&[0-9]+>/g;
export const REGEX_TIMESTAMP = /<t:[0-9]+:[a-zA-Z]>/g;
export const REGEX_ID = /<(@!?|#|@&|a?:[\S]+:|t:)[0-9]+(:.)?>/g;
export const REGEX_DISCORD_OBJECT = /<(@!?|#|@&|a?:[\S]+:|t:)[0-9]+(:.)?>/g;
export const REGEX_RAW_ID = /([0-9]{17,20})/g;
export const REGEX_AUDIT_LOG_ID = /\(([0-9]{17,20})\)/;
export const REGEX_TIMEOUT_UNTIL = /TIMEOUT_UNTIL:([0-9]+)/;
export const REGEX_RAW_ID_ONLY = /^([0-9]{17,20})$/;
export const REGEX_MESSAGE_LINK_OR_FULL_ID =
  /(?:\/[0-9]{17,20}\/)?(?:([0-9]{17,20})[-/])([0-9]{17,20})/; // link or channelId-messageId.
export const REGEX_MESSAGE_LINK =
  /\/channels\/[0-9]{17,20}\/([0-9]{17,20})\/([0-9]{17,20})/; // guildId/channelId/messageId
export const REGEX_MESSAGE_ID =
  /(?:\/[0-9]{17,20}\/)?(?:([0-9]{17,20})[-/])?([0-9]{17,20})/; // messageId, channelId-messageId, or link
