module.exports.name = 'activity';
const Util = require('../classes/Util.js');

module.exports.alias = [
  'activity'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,activity [ @mention ]` Displays server or user activity for the past 30 days (UTC).';

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateToString(d) {
  const month = MONTH[d.getUTCMonth()];
  const date = d.getUTCDate();
  const day = DAY[d.getUTCDay()];
  return `${month} ${date < 10 ? `0${date}` : date}(${day})`;
}

module.exports.command = async (message, content, bot, server) => {
  const thirtyDays = new Array(30);
  let u =  await Util.searchUser(message, content, server, bot);
  if (u) {
    let record = server.users[u.id];
    let count = 0;
    for (let i = server.today; i >= server.today - 30; i--) {
      let chans = record.record[(i + 31) % 31]; // for under flows
      for (let ch in chans) {
        if (ch == 'jpn' || ch == 'eng' || ch == 'vc' || ch == 'rxn') continue;
        thirtyDays[count] += chans[ch];
      }
      count++;
    }
  }

  let today = new Date();
  let s = '';
  for (let c of thirtyDays) {
    s = `${s}\n${dateToString(today)}: ${c}`;
    today = today.setDate(today.getUTCDate() - 1);
  }
  message.channel.send(s, {split: true});
};
