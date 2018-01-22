const config = require('./config.json');
const request = require('request');
const fs = require('fs');

function updateImgur() {
  var options = { method: 'POST',
    url: 'https://api.imgur.com/oauth2/token',
    headers:
     {
       'cache-control': 'no-cache',
       'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData: {refresh_token: config.imgurRefreshToken, client_id: config.imgurID, client_secret: config.imgurSecret, grant_type: 'refresh_token' } };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var ret = JSON.parse(body);
    config.imgurAccessToken = ret.access_token;
    config.lastUpdate = new Date().getTime();
    console.log('imgurAccessToken updated: ' + ret.access_token);
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), function (err) {
      if (err) return console.log(err);
    });
  });
}


module.exports = function task(bot) {
  for (var sid in bot.servers) {
    let s = bot.servers[sid];
    s.save(true); // saves the state everyday
    s.today = (s.today + 1) % 31;
    for (var user in s.users) {
      let uRec = s.users[user];
      if (uRec.adjust(s.today)) {
        delete s.users[user];
      }
    }
  }

  if (new Date().getTime() - config.lastUpdate > 2419200000) { // 28 days
    updateImgur();
  }

  setTimeout(() => {
    task(bot);
  }, 24*60*60*1000); // 24*60*60*1000 = a day
};
