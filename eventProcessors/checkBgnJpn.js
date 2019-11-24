module.exports.name = 'checkBeginnerJapanese';
module.exports.events = ['NEW', 'EDIT'];

module.exports.initialize = (json, server) => {
  server.kanjis = {};
  if (!json || !json['kanjis']) return;
  server.kanjis = json['kanjis'];
};
module.exports.isAllowed = (message) => {
  return message.channel.id == '208118574974238721';
};

const Util = require('../classes/Util.js');
const N5 = /[安一二飲右雨駅円火花下何会外学間気九休魚金空月見言古五後午語校口行高国今左三山四子耳時七車社手週十出書女小少上食新人水生西川千先前足多大男中長天店電土東道読南日入年買白八半百父分聞母北木本毎万名目友来立六話]/;
const N4 = /[悪暗医意以引院員運英映遠屋音歌夏家画海回開界楽館漢寒顔帰起究急牛去強教京業近銀区計兄軽犬研県建験元工広考光好合黒菜作産紙思姉止市仕死使始試私字自事持室質写者借弱首主秋集習終住重春所暑場乗色森心親真進図青正声世赤夕切説洗早走送族村体太待貸台代題短知地池茶着昼注町鳥朝通弟低転田都度答冬頭同動堂働特肉売発飯病品不風服物文別勉便歩方妹味民明門問夜野薬有曜用洋理旅料力林]/;
const N3plus = /[当誰俺難違僕他付伝位例全公内初助化君和変丈夫失守昔昨最未末様次然的直石礼笑米糸絵美良虫血負部配面願寝皆眠感頑張]/;
const parensregex = /[\u4E00-\u9FAF]+[\u3040-\u309F]{0,3}(?:[(（【]|\|\|)[\u3040-\u309F]+(?:\|\||[)）】])/g;

module.exports.process = (message, server) => {
  let content = message.content.replace(Util.REGEX_URL, ''); // url replace
  content = content.replace(parensregex, ''); // if they put the reading in parens, its fine

  let reacted = false;
  let threshold = 2;
  for (let i = 0; i < content.length; i++) {
    let l = content[i];
    if (/[\u4E00-\u9FAF]/.test(l) && !(N5.test(l) || N4.test(l) || N3plus.test(l))) {
      if (server.kanjis[l]) {
        server.kanjis[l]++;
      } else {
        server.kanjis[l] = 1;
      }
      --threshold;
      if (threshold <= 0 && !reacted) {
        message.react('🔰');
        reacted = true;
      }
    }
  }
  if (!reacted) {
    for (let r of message.reactions.values()) {
      if (r.me) r.remove();
    }
  }
};