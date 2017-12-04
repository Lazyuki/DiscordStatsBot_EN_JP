const fs = require('fs');
const nohup = './nohup.out';

module.exports.alias = [
	'error'
];

module.exports.command = (message, content, bot) => {
	if (message.author.id != bot.owner_ID) return;
	if (content == 'reset') {
		fs.writeFile(nohup, '', function (err) {
			if (err) {
				message.channel.send('write failed: ' + err);
				return;
			};
			message.channel.send('done');
		})
	} else {
		fs.readFile(nohup, 'utf8', function (err, data) {
			if (err) {
				message.channel.send('read failed: ' + err);
				return;
			};
			if (data.length > 2000) {
				message.channel.send(`\`\`\`${data.substr(data.length - 1990)}\`\`\``)
			} else {
				message.channel.send(`\`\`\`${data ? data : 'Empty'}\`\`\``);
			}
		});
	}
};
