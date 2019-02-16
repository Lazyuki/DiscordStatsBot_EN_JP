module.exports.name = 'activity';
const Util = require('../classes/Util.js');

module.exports.alias = [
  'activity'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,activity [ user ] [ -n ] [ -s ]` Displays server or user activity for the past 30 days (UTC). `-n` to show numbers, `-s` for the entire server';

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateToString(d) {
  const month = MONTH[d.getUTCMonth()];
  const date = d.getUTCDate();
  const day = DAY[d.getUTCDay()];
  return `${month} ${date < 10 ? `0${date}` : date}(${day})`;
}

module.exports.command = async (message, content, bot, server) => {
  const thirtyDays = new Array(30).fill(0);
  let showNum = /-n?s/.test(content);
  let forServer = /-s?n/.test(content);
  let u;
  content = content.replace(/-[ns]{1,2}/g, '');

  if (forServer) {
    for (let id in server.users) {
      let record = server.users[id];
      let count = 0;
      for (let i = server.today; i > server.today - 30; i--) {
        let chans = record.record[(i + 31) % 31]; // for under flows
        for (let ch in chans) {
          if (ch == 'jpn' || ch == 'eng' || ch == 'vc' || ch == 'rxn') continue;
          thirtyDays[count] += chans[ch];
        }
        count++;
      }
    }
  } else {
    u =  await Util.searchUser(message, content, server, bot);
    u = u || message.author;
    let record = server.users[u.id];
    let count = 0;
    for (let i = server.today; i > server.today - 30; i--) {
      let chans = record.record[(i + 31) % 31]; // for under flows
      for (let ch in chans) {
        if (ch == 'jpn' || ch == 'eng' || ch == 'vc' || ch == 'rxn') continue;
        thirtyDays[count] += chans[ch];
      }
      count++;
    }
  }
  let date = new Date();
  let s = '```';
  if (!showNum) {
    const max = Math.max(...thirtyDays);
    const maxBar = '････････････････････';
    for (let c of thirtyDays) {
      s = `${dateToString(date)}: ${maxBar.substr(0, 20 * c / max)}\n${s}`;
      date.setDate(date.getUTCDate() - 1);
    }
  } else {
    for (let c of thirtyDays) {
      s = `${dateToString(date)}: ${c}\n${s}`;
      date.setDate(date.getUTCDate() - 1);
    }
  }
  s = '```' + s;
  message.channel.send(`Server activity${forServer ?  '' : ' for ' + u.tag}\n` + s, {split: true});
};
