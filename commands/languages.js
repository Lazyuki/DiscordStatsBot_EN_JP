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
  if (min !== 0 && !min) {
    min = 100;
  }
  if (min < 0) {
    const members = server.guild.members;
    const langs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let mem of members.values()) {
      if (mem) {
        const roles = mem.roles;
        if (roles.has(NE)) ++langs[0];
        if (roles.has(NJ)) ++langs[1];
        if (roles.has(FE)) ++langs[2];
        if (roles.has(FJ)) ++langs[3];
        if (roles.has(OL)) ++langs[4];
        if (roles.has(NE) && roles.has(NJ)) ++langs[5];
        if (roles.has(NJ) && roles.has(FE)) ++langs[6];
        if (roles.has(NJ) && roles.has(OL)) ++langs[7];
        if (roles.has(NE) && roles.has(OL)) ++langs[8];
        if (roles.has(FJ) && roles.has(FE)) ++langs[9];
        ++langs[10];
      }
    }
    message.channel.send(`Out of ${langs[7]} people,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[4]} are Other Language\n${langs[5]} are both NE and NJ\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`);
    return;
  }
  const users = server.users;
  const langs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
        if (roles.has(NE) && roles.has(NJ)) ++langs[5];
        if (roles.has(NJ) && roles.has(FE)) ++langs[6];
        if (roles.has(NJ) && roles.has(OL)) ++langs[7];
        if (roles.has(NE) && roles.has(OL)) ++langs[8];
        if (roles.has(FJ) && roles.has(FE)) ++langs[9];
        ++langs[10];
      }
    }
  }
  message.channel.send(`Out of ${langs[10]} people who have sent more than ${min} messages in the past 30 days,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[4]} are Other Language\n${langs[5]} are both NE and NJ\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`);
};
