const fs = require('fs');

let processors = {};
let inits = [];

fs.readdir('./eventProcessors/', (err, files) => {
  files.forEach((file) => {
    let processor = require(`./eventProcessors/${file}`);
    processor.events.forEach((event) => {
      if (processors[event]) {
        processors[event].push(processor);
      } else {
        processors[event] = [processor];
      }
    });
    if (processor.initialize) inits.push(processor.initialize);
  });
});

module.exports.processors = processors;
module.exports.inits = inits;
