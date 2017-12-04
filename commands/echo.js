module.exports.alias = [
	'echo'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	message.channel.send(content);
	message.channel.send(`\`\`\`${content}\`\`\``);
};
