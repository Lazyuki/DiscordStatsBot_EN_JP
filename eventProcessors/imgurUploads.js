module.exports.name = 'imgurUploads';
module.exports.events = ['NEW'];

module.exports.initialize = (json, server) => {
  server.watchedImagesID = [];
  server.watchedImagesLink = [];
  if (!json || !json['watchedImagesID']) return;
  server.watchedImagesID = json['watchedImagesID'];
  server.watchedImagesLink = json['watchedImagesLink'];
};
module.exports.isAllowed = (message, server) => {
  return server.watchedUsers.includes(message.author.id);
};

const config = require('../config.json');
const request = require('request');

module.exports.process = (message, server) => {
  if (message.attachments.size > 0) {
    let imageURL = message.attachments.first().url;
    var options = {
      method: 'POST',
      url: 'https://api.imgur.com/3/image',
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${config.imgurAccessToken}`,
        'content-type':
          'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      formData: {
        image: imageURL,
        album: config.imgurAlbum,
        description: `In ${message.channel.name} by ${message.author.tag}`,
        type: 'URL',
      },
    };
    request(
      options,
      function (error, response, body) {
        if (error) {
          console.log(error);
          return;
        }
        let ret = JSON.parse(body);
        if (ret.data.link == undefined) {
          console.log(JSON.stringify(ret));
        } else {
          this.watchedImagesID.push(message.id);
          this.watchedImagesLink.push(ret.data.link);
          if (this.watchedImagesID.length > 50) {
            this.watchedImagesID.shift();
            this.watchedImagesLink.shift();
          }
        }
      }.bind(server)
    ); // Bind server as 'this' in the callback
  }
};
