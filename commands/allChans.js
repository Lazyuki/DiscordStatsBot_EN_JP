module.exports.alias = [
	'allchans',
	'allChans',
	'ac'
];

module.exports.command = (message, content, bot) => {
	//if (message.author.id != bot.owner_ID) return;
	let ignoreHidden = !bot.server.hiddenChannels.includes(message.channel.id);

	var allch = {};
	for (var user in bot.server.users) {
		var u = bot.server.users[user];
		for (var ch in u.channels) {
			if (u.channels[ch] == 0) {
				delete u.channels[ch];
				continue;
			}
			if (bot.server.hiddenChannels.includes(ch) && ignoreHidden) continue;
			if (allch[ch]) {
				allch[ch] += u.channels[ch];
			} else {
				allch[ch] = u.channels[ch];
			}
		}
	}

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
