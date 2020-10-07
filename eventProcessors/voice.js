module.exports.name = 'voiceStateChange';
module.exports.events = ['VOICE'];

function isVC(voiceState) {
  return (
    voiceState &&
    voiceState.channelID &&
    voiceState.channelID !== voiceState.guild.afkChannelID &&
    !voiceState.deaf
  );
}
module.exports.initialize = (json, server) => {
  server.tempvc = {};
  for (let [, vc] of server.guild.channels.cache.filter(
    (c) => c.type === 'voice'
  )) {
    for (let [, mem] of vc.members) {
      if (mem.user.bot) continue; // ignore bots
      if (isVC(mem.voice)) server.tempvc[mem.id] = new Date().getTime();
    }
  }
};
module.exports.isAllowed = () => {
  return true;
};

let UserRecord = require('../classes/UserRecord.js');
module.exports.process = async (oldState, newState, server) => {
  let id = oldState.id || newState.id;
  // joined vc and not deaf
  if (!isVC(oldState) && isVC(newState)) {
    server.tempvc[id] = new Date().getTime();
    if (server.unmuteQ.includes(id)) {
      // Unmutes people who are in the unmute queue
      await newState.setMute(false);
      let index = server.unmuteQ.indexOf(id);
      server.unmuteQ.splice(index, 1);
    }
    if (server.muteQ.includes(id)) {
      await newState.setMute(true);
      let index = server.muteQ.indexOf(id);
      server.muteQ.splice(index, 1);
    }
    // left vc
  } else if (isVC(oldState) && !isVC(newState)) {
    if (!server.users[id]) {
      server.users[id] = new UserRecord();
    }
    if (!server.tempvc[id]) return;
    server.users[id].addVoiceTime(
      server.today,
      new Date().getTime() - server.tempvc[id]
    ); // millisecond
    delete server.tempvc[id];
  }
};

// called when restarting/shutting down the bot
module.exports.end = (server) => {
  for (let id in server.tempvc) {
    if (!server.users[id]) {
      server.users[id] = new UserRecord();
    }
    server.users[id].addVoiceTime(
      server.today,
      new Date().getTime() - server.tempvc[id]
    ); // millisecond
  }
  delete server.tempvc;
};
