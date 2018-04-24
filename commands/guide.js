module.exports.name = 'guide';

module.exports.alias = [
  'guide',
  'start',
  'g'
];


module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '`,g [ guides | kana | kanji | grammar | vocab | IME | dictionary | anki ]` Japanese learning guide';

const Discord = require('discord.js');
const externalLink = '<:externallink:438354612379189268>';

module.exports.command = (message, content) => {
  let embed = new Discord.RichEmbed();
  content = content.toLowerCase();
  if (content == 'guides') {
    embed.title = `__**Guides ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#beginner-guide';
    embed.description = 'All beginners should read one of the below guides';
    embed.addField('r/LearnJapanese\'s guide', 'https://www.reddit.com/r/LearnJapanese/wiki/index/startersguide', false);
    embed.addField('A well written DJT guide', 'https://djtguide.neocities.org/guide.html', false);
  } else if (content == 'kana') {
    embed.title = `__**Kana ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#hiragana-and-katakana';
    embed.description = 'The first step is learning Hiragana and Katakana. ';
    embed.addField('Tofugu Hiragana guide', 'https://www.tofugu.com/japanese/learn-hiragana/', false);
    embed.addField('Tofugu Katakana guide', 'https://www.tofugu.com/japanese/learn-katakana/', false);
  } else if (content == 'kanji') {
    embed.title = `__**Kanji ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#kanji';
    embed.description = 'After you\'ve got your kana down, you need Kanji.';
    embed.addField('Anki decks', 'https://djtguide.neocities.org/anki.html', true);
    embed.addField('Wanikani ($)', 'https://www.wanikani.com/', true);
    embed.addField('Kanji Koohi', 'https://kanji.koohii.com/', true);
    embed.addField('Kanji Damage', 'http://www.kanjidamage.com/introduction', true);
  } else if (content == 'grammar') {
    embed.title = `__**Grammar ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#grammar';
    embed.description = 'You can either use a structured textbook or a more free-form online grammar guide like Tae-Kim. Either one works, try one or both and stick with the one you like the best.';
    embed.addField('Genki: Beginner textbook', 'http://genki.japantimes.co.jp/index_en', false);
    embed.addField('Tobira: Intermediate textbook', 'http://tobiraweb.9640.jp/', false);
    embed.addField('Tae-Kim: Online guide', 'http://www.guidetojapanese.org/learn/grammar', false);
  } else if (content == 'vocab') {
    embed.title = `__**Vocabulary ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#vocabulary';
    embed.description = 'For vocabulary, three nice options are: ';
    embed.addField('Wanikani ($)', 'https://www.wanikani.com/', true);
    embed.addField('Memrise', 'https://www.memrise.com/', true);
    embed.addField('Anki', 'http://ankisrs.net/', true);
  } else if (content == 'ime' || content == 'type') {
    embed.title = `__**Keyboard ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#software';
    embed.description = 'You need to have a software to type in Japanese';
    embed.addField('Installing a Japanese Keyboard', 'https://www.tofugu.com/japanese/how-to-install-japanese-keyboard/', false);
    embed.addField('Typing Guide', 'https://www.tofugu.com/japanese/how-to-type-in-japanese/', false);
  } else if (content == 'dictionary' || content == 'dictionaries') {
    embed.title = `__**Dictionaries ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#dictionary';
    embed.description = 'For translating, avoid using Google Translate. Instead, one of these websites:';
    embed.addField('Jisho.org', 'http://jisho.org/', true);
    embed.addField('Tangorin', 'http://tangorin.com/', true);
    embed.addField('Weblio', 'http://www.weblio.jp/', true);
  } else {
    embed.title = `__**New to Japanese? Start here! ${externalLink}**__`;
    embed.url = 'https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md#beginner-guide';
  }
  embed.color = 8843151;
  message.channel.send({embed});
};
