module.exports.name = 'addEditedMessages';
module.exports.events = ['EDIT'];

const SimpleMsg = require('../classes/SimpleMessage.js');
const Util = require('../classes/Util.js');

module.exports.isAllowed = (message, server) => {
  return server.watchedUsers.includes(message.author.id);
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 */
function distance(source, target) {
  let m = source.length, n = target.length, INF = m+n, score = new Array(m+2), sd = {};
  for (let i = 0; i < m+2; i++) score[i] = new Array(n+2);
  score[0][0] = INF;
  for (let i = 0; i <= m; i++) {
    score[i+1][1] = i;
    score[i+1][0] = INF;
    sd[source[i]] = 0;
  }
  for (let j = 0; j <= n; j++) {
    score[1][j+1] = j;
    score[0][j+1] = INF;
    sd[target[j]] = 0;
  }

  for (let i = 1; i <= m; i++) {
    let DB = 0;
    for (let j = 1; j <= n; j++) {
      let i1 = sd[target[j-1]],
        j1 = DB;
      if (source[i-1] === target[j-1]) {
        score[i+1][j+1] = score[i][j];
        DB = j;
      }
      else {
        score[i+1][j+1] = Math.min(score[i][j], score[i+1][j], score[i][j+1]) + 1;
      }
      score[i+1][j+1] = Math.min(score[i+1][j+1], score[i1] ? score[i1][j1] + (i-i1-1) + 1 + (j-j1-1) : Infinity);
    }
    sd[source[i-1]] = i;
  }
  return score[m+1][n+1];
}


module.exports.process = async function(message, server) {
  let dist = distance(message.content, message.edits[message.edits.length - 1].content); // distance from original
  if (dist <= 2) return;
  let simple = new SimpleMsg({message : message, del: false});
  Util.postLogs(simple, server);
};