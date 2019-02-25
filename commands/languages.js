module.exports.name = 'languages';

module.exports.alias = [
  'lang'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '`,lang [ minMessage=100 ] `';

const NE = '197100137665921024';
const NJ = '196765998706196480';
const FE = '241997079168155649';
const FJ = '270391106955509770';
const OL = '248982130246418433'; 

module.exports.command = async (message, content, bot, server) => {
  let min = parseInt(content);
  if (!min) {
    min = 100;
  }
  const users = server.users;
  const langs = [0, 0, 0, 0, 0];
  for (let user in users) {
    let res = users[user].totalStats();
    if (res >= min) {
      const mem = server.guild.member(user);
      if (mem) {
        const roles = mem.roles;
        if (roles.has(NE)) ++langs[0];
        if (roles.has(NJ)) ++langs[1];
        if (roles.has(FE)) ++langs[2];
        if (roles.has(FJ)) ++langs[3];
        if (roles.has(OL)) ++langs[4];
      }
    }
  }
  message.channel.send(`Out of people who have sent more than ${min} messages,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[4]} are Other Language`);
};
