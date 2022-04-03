const fs = require('fs');
const init = require('./init.json');

let commands = {};
let inits = [];
let commandNames = {}
const migratedCommands = init.migratedCommands || []

fs.readdir('./commands/', (err, files) => {
  files.forEach((file) => {
    if (!file.endsWith('.js')) return;
    let command = require(`./commands/${file}`);
    if (command.initialize) inits.push(command.initialize);
    if (migratedCommands.includes(command.name)) {
      command.isCirillaCommand = true;
    }
    commandNames[command.name] = command;
    command.alias.forEach((name) => {
      if (commands[name]) throw new Error(`The alias ${name} is already used.`);
      commands[name] = command;
    });
  });
});
module.exports.commandNames = commandNames;
module.exports.commands = commands;
module.exports.inits = inits;
