// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
export const REGEX_JPN = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
export const REGEX_ENG = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
export const REGEX_URL = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;

export const REGEX_CUSTOM_EMOTES = /(<a?:[^:]+:[0-9]+>)/g;
export const REGEX_EMOJIS =
  /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
export const REGEX_USER = /<@!?[0-9]+>/g;
export const REGEX_CHAN = /<#[0-9]+>/g;
export const REGEX_ROLE = /<@&[0-9]+>/g;
export const REGEX_TIMESTAMP = /<t:[0-9]+:[a-zA-Z]>/g;
export const REGEX_ID = /<(@!?|#|@&|a?:[\S]+:|t:)[0-9]+(:.)?>/g;
export const REGEX_DISCORD_OBJECT = /<(@!?|#|@&|a?:[\S]+:|t:)[0-9]+(:.)?>/g;
export const REGEX_RAW_ID = /([0-9]{17,20})/g;
export const REGEX_RAW_ID_ONLY = /^([0-9]{17,20})$/;
export const REGEX_MESSAGE_FULL_ID = /(?:([0-9]{17,20})-)?([0-9]{17,20})/; // messageId or channelId-messageId. channelId can be a threadChannel instead
export const REGEX_MESSAGE_LINK =
  /\/channels\/[0-9]{17,20}\/([0-9]{17,20})\/([0-9]{17,20})/g; // guildId/channelId/messageId
export const REGEX_MESSAGE_ID =
  /(?:\/[0-9]{17,20}\/)?(?:([0-9]{17,20})[-/])?([0-9]{17,20})/;
