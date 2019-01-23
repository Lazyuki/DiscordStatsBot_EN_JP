module.exports.name = 'updateCategoryClocks';
module.exports.events = ['HOURLY'];

module.exports.initialize = (json, server) => {
  server.categoryClocks = [];
  if (!json || !json['categoryClocks']) return;
  server.categoryClocks = json['categoryClocks'];
};

// format: "any text ${}"
const timeRegex = /\$\{([^}]*)\}/g;
function parseTime(timeString, pad) {
  const date = new Date();
  function replaceTime(str, timezone) {
    try {
      const ret = date.toLocaleString('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone
      });
      if (!pad && ret[0] === '0') {
        return ret[1];
      }
      return ret;
    } catch (e) {
      return str;
    }
  }
  return timeString.replace(timeRegex, replaceTime);
}
module.exports.process = async (server) => {
  if (server.categoryClocks.length > 0) {
    for (let c of server.categoryClocks) {
      const categoryID = c.id;
      const category = server.guild.channels.get(categoryID);
      if (category) {
        category.setName(parseTime(c.timeString, c.pad));
      }
    }
  }
};