const fs = require('fs');

let processors = {};
let inits = [];

fs.readdir('./eventProcessors/', (err, files) => {
  files.forEach((file) => {
    let processor = require(`./eventProcessors/${file}`);
    processor.actions.forEach((action) => {
      if (processors[action]) {
        processors[action].push(processor);
      } else {
        processors[action] = [processor];
      }
    });
    if (processor.initialize) inits.push(processor.initialize);
  });
});

module.exports.processors = processors;
module.exports.inits = inits;
