module.exports.alias = [
	'kc'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	switch (content) {
		case 'list':
			// Sorts the kanjis
		  var sortable = [];
			for (var k in server.kanjis) {
			  sortable.push([k, server.kanjis[k]]);
			}
			sortable.sort(function(a, b) {
			  return b[1] - a[1];
			});
			message.channel.send(JSON.stringify(sortable));
			break;
		default:
			server.kanjiCheck = !server.kanjiCheck;
			message.channel.send('done');
	}
};
