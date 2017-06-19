const fs = require('fs');

let commands = [];

fs.readdir('./commands/', (err, files) => {
	files.forEach((file) => {
		let command = require(`./commands/${file}`);
		command.alias.forEach((name) => {
			if (commands[name]) throw new Error(`The alias ${name} is already used.`);
			commands[name] = require(`./commands/${file}`);
		});
	});
});

module.exports = commands;
