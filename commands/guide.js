module.exports.name = 'guide';

module.exports.alias = [
  'guide',
  'start',
  'resources'
];


module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '`,start [ guide | kana | kanji | grammar | vocab | IME | dictionary ]` Japanese learning guide';

const Discord = require('discord.js');

module.exports.command = (message, content) => {
  let embed = new Discord.RichEmbed();
  content = content.toLowerCase();
  embed.title = '[Complete Guide<:externallink:437129837149159435>](https://github.com/ryry013/Awesome-Japanese#beginner-guide)';
  if (content == '' || content == 'guide') {
    embed.description = 'All beginners should read one of the below guides';
    embed.addField('r/LearnJapanese\'s guide', 'https://www.reddit.com/r/LearnJapanese/wiki/index/startersguide', false);
    embed.addField('A well written DJT guide', 'https://djtguide.neocities.org/guide.html', false);
  } else if (content == 'kana') {
    embed.description = 'The first step is learning Hiragana and Katakana.';
    embed.addField('Tofugu Hiragana guide', 'https://www.tofugu.com/japanese/learn-hiragana/', false);
    embed.addField('Tofugu Katakana guide', 'https://www.tofugu.com/japanese/learn-katakana/', false);
  } else if (content == 'kanji') {
    embed.description = 'After you\'ve got your kana down, you need Kanji. ';
    embed.addField('Anki decks', 'https://djtguide.neocities.org/anki.html', true);
    embed.addField('Wanikani ($)', 'https://www.wanikani.com/', true);
    embed.addField('Kanji Koohi', 'https://kanji.koohii.com/', true);
    embed.addField('Kanji Damage', 'http://www.kanjidamage.com/introduction', true);
  } else if (content == 'grammar') {
    embed.description = 'You can either use a structured textbook or a more free-form online grammar guide:';
    embed.addField('Genki: Beginner textbook', 'http://genki.japantimes.co.jp/index_en', false);
    embed.addField('Tobira: Intermediate textbook', 'http://tobiraweb.9640.jp/', false);
    embed.addField('Tae-Kim: Online guide', 'http://www.guidetojapanese.org/learn/grammar', false);
  } else if (content == 'vocab') {
    embed.description = 'For vocabulary, three nice options are:';
    embed.addField('Wanikani ($)', 'https://www.wanikani.com/', true);
    embed.addField('Memrise', 'https://www.memrise.com/', true);
    embed.addField('Anki', 'http://ankisrs.net/', true);
  } else if (content == 'ime') {
    embed.description = 'You either need to change keyboard settings, or install a software to type in Japanese';
    embed.addField('How to install a Japanese Keyboard', 'https://www.tofugu.com/japanese/how-to-install-japanese-keyboard/', false);
    embed.addField('Google IME', 'https://tools.google.com/dlpage/japaneseinput/eula.html?platform=win', false);
  } else if (content == 'dictionary') {
    embed.description = 'For translating, avoid using Google Translate. Instead, one of these websites';
    embed.addField('Jisho.org', 'http://jisho.org/', true);
    embed.addField('Tangorin', 'http://tangorin.com/', true);
    embed.addField('Weblio', 'http://www.weblio.jp/', true);
  } else {
    message.channel.send('Usage: `,start [ guide | kana | kanji | grammar | vocab | IME | dictionary ]`');
    return;
  }
  embed.color = 16711935;
  message.channel.send({embed});
};
