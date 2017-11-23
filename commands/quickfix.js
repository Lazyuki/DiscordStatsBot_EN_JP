module.exports.alias = [
	'kc'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	switch (content) {
		case 'list':
			// Sorts the kanjis
		  let sortable = [];
			for (var k in server.kanjis) {
			  sortable.push([k, server.kanjis[k]]);
			}
			sortable.sort(function(a, b) {
			  return b[1] - a[1];
			});
			let str = '';
			for (var k in sortable) {
				str += sortable[k][0] + ':' + sortable[k][1] + ','
			}
			str = str.substr(0, str.length - 1);
			message.channel.send(str);
			break;
		default:
			server.kanjiCheck = !server.kanjiCheck;
			message.channel.send('done');
	}
};
