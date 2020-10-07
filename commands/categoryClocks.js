module.exports.name = 'categoryClocks';

module.exports.alias = ['categoryclocks', 'cc'];

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help =
  ' Set up and configure hourly category clocks. `,cc < set | delete | list > [CATEGORY_ID] [ t | f for padding 0s] ["Time format string"]`\nUse "TZ Database Name" from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones inside `${TZ_name}` for specifying the timezone.\ne.g. `,cc set 537289285129469954 "Time: 🇯🇵${Asia/Tokyo}時 🇺🇸${America/New_York}時"` or to disable, `,cc delete 537289285129469954`';

const timeStringRegex = /"(.*)"/;

module.exports.command = async (message, content, bot, server) => {
  const arr = content.split(/\s/);
  switch (arr[0]) {
    case 'set': {
      const ch = server.guild.channels.get(arr[1]);
      const pad = arr[2] === 't';
      const timeStringMatch = timeStringRegex.exec(content);
      let timeString;
      if (timeStringMatch) {
        timeString = timeStringMatch[1];
      } else {
        message.channel.send(
          'Category name string must be surrounded by double quotes.'
        );
        return;
      }
      if (ch) {
        for (let i in server.categoryClocks) {
          let c = server.categoryClocks[i];
          if (c.id === ch.id) {
            server.categoryClocks[i] = {
              id: ch.id,
              pad,
              timeString,
            };
            message.channel.send('Category clock set!');
            server.hourly();
            return;
          }
        }
        server.categoryClocks.push({
          id: ch.id,
          pad,
          timeString,
        });
        message.channel.send('Category clock set!');
        server.hourly();
        return;
      } else {
        message.channel.send('Could not find the specified category ID');
        return;
      }
    }
    case 'delete': {
      const id = arr[1];
      for (let i in server.categoryClocks) {
        let c = server.categoryClocks[i];
        if (c.id === id) {
          server.categoryClocks.splice(i, 1);
          message.channel.send(`Deleted ${id}`);
          return;
        }
      }
      message.channel.send(`Failed to find category clock for ${id}`);
      return;
    }
    case 'list': {
      let s = '';
      for (let c of server.categoryClocks) {
        s += `${c.id} (<#${c.id}>) pad? ${c.pad} : "\`${c.timeString}\`"\n`;
      }
      if (!s) {
        message.channel.send('No category clocks set.');
      } else {
        message.channel.send(s);
      }
      return;
    }
    default:
      message.channel.send('Invalid arguments. Try `,h categoryclocks`');
      return;
  }
};
