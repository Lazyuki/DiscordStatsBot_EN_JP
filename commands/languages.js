module.exports.name = 'languages';

module.exports.alias = ['lang'];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help =
  '`,lang [ minMessage=100 ]`\nUse `,lang all` to include everyone';

const NE = '197100137665921024';
const NJ = '196765998706196480';
const FE = '241997079168155649';
const FJ = '270391106955509770';
const AJ = '681835604484423693';
const OL = '248982130246418433';

module.exports.LANG_ROLES = [NE, NJ, FE, FJ, AJ, OL];

module.exports.command = async (message, content, bot, server) => {
  let min = parseInt(content);
  if (content === 'all') min = -1;
  if (min !== 0 && !min) {
    min = 100;
  }
  if (min < 0) {
    const members = server.guild.members;
    const langs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let mem of members.cache.values()) {
      if (mem) {
        const roles = mem.roles;
        if (roles.cache.has(NE)) ++langs[0];
        if (roles.cache.has(NJ)) ++langs[1];
        if (roles.cache.has(FE)) ++langs[2];
        if (roles.cache.has(FJ)) ++langs[3];
        if (roles.cache.has(OL)) ++langs[4];
        if (roles.cache.has(NE) && roles.cache.has(NJ)) ++langs[5];
        if (roles.cache.has(NJ) && roles.cache.has(FE)) ++langs[6];
        if (roles.cache.has(NJ) && roles.cache.has(OL)) ++langs[7];
        if (roles.cache.has(NE) && roles.cache.has(OL)) ++langs[8];
        if (roles.cache.has(FJ) && roles.cache.has(FE)) ++langs[9];
        ++langs[10];
      }
    }
    message.channel.send(
      `Out of ${langs[10]} people,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[4]} are Other Language\n\n${langs[5]} are NJ and NE\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`
    );
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
        if (roles.cache.has(NE)) ++langs[0];
        if (roles.cache.has(NJ)) ++langs[1];
        if (roles.cache.has(FE)) ++langs[2];
        if (roles.cache.has(FJ)) ++langs[3];
        if (roles.cache.has(OL)) ++langs[4];
        if (roles.cache.has(NE) && roles.cache.has(NJ)) ++langs[5];
        if (roles.cache.has(NJ) && roles.cache.has(FE)) ++langs[6];
        if (roles.cache.has(NJ) && roles.cache.has(OL)) ++langs[7];
        if (roles.cache.has(NE) && roles.cache.has(OL)) ++langs[8];
        if (roles.cache.has(FJ) && roles.cache.has(FE)) ++langs[9];
        ++langs[10];
      }
    }
  }
  message.channel.send(
    `Out of ${langs[10]} people who have sent more than ${min} messages in the past 30 days,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[4]} are Other Language\n\n${langs[5]} are NJ and NE\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`
  );
};
