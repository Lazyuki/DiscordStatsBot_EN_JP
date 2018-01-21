module.exports.name = 'voiceStateChange';
module.exports.events = ['VOICE'];

let temp = {};
module.exports.initialize = (json, server) => {
  for (let [id, vc] of server.guild.channels.filter(c => {return c.type == 'voice';})) {    
    for (let [memid, mem] of vc.members) {
      temp[mem.id] = new Date().getTime();
    }
  }
};
module.exports.isAllowed = () => {
  return true;
};

function isVC(member) {
  return member.voiceChannel && member.voiceChannel.id != member.guild.afkChannelID && !member.deaf;
}

let UserRecord = require('../classes/UserRecord.js');
module.exports.process = async (oldMember, newMember, server) => {
  let id = oldMember.id;
  if (!isVC(oldMember) && isVC(newMember)) {
    temp[id] = new Date().getTime();
  } else if (isVC(oldMember) && !isVC(newMember)) {
    if (!server.users[id]) {
      server.users[id] = new UserRecord();
    }
    if (!temp[id]) return;
    console.log(`---- Normal Add For ${id} ----`); 
    server.users[id].addVoiceTime(server.today, new Date().getTime() - temp[id]); // millisecond
    delete temp[id];    
  }
};

module.exports.end = (server) => {
  for (let id in temp) {
    if (!server.users[id]) {
      server.users[id] = new UserRecord();
    }
    console.log(`---- Left Over Add For ${id} ----`);    
    server.users[id].addVoiceTime(server.today, new Date().getTime() - temp[id]); // millisecond
  }
};
