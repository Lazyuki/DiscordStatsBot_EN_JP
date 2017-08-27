module.exports.alias = [
	'channels',
	'ch'
];

module.exports.command = (message, content, bot, server) => {
	let ignoreHidden = !server.hiddenChannels.includes(message.channel.id);

	var allch = {};
	for (var user in server.users) {
		var u = server.users[user];
		for (var ch in u.chans) {
			if (u.chans[ch] == 0) {
				delete u.chans[ch];
				continue;
			}
			if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
			if (ch == '293787390710120449') continue; // #testing-ground
			if (allch[ch]) {
				if (!allch[ch] > 0) continue;
				allch[ch] += u.chans[ch];
			} else {
				allch[ch] = u.chans[ch];
			}
		}
	}

// Sort by number of messages
	var sortable = [];
	for (var c in allch) {
	  sortable.push([c, allch[c]]);
	}
	sortable.sort(function(a, b) {
	    return b[1] - a[1];
	});

	var s = "";
  for (var i in sortable) {
	  s += "<#" + sortable[i][0] + "> : " + sortable[i][1] + "\n";
	}
  message.channel.send(s);
};
