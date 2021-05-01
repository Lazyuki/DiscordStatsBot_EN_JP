module.exports.name = 'languages';

module.exports.alias = ['lang'];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help =
  '`,lang [ -m minimum message. Default = 100 ] [ -v minimum voice. Default = 10 hours ]`\nUse `,lang all` to include everyone\nUse impossible large numbers to exclude voice/text count `,lang -v 9999`';

const NE = '197100137665921024';
const NJ = '196765998706196480';
const FE = '241997079168155649';
const FJ = '270391106955509770';
const AJ = '681835604484423693';
const OL = '248982130246418433';
const HJ = '816895873493499935';
const FE_J = '820133363700596756';

module.exports.LANG_ROLES = [NE, NJ, FE, FJ, AJ, OL];

module.exports.command = async (message, content, bot, server) => {
  let msgLimit = 100;
  let vcLimit = 10;

  const msgOption = /-m (\d+)/.exec(content);
  const vcOption = /-v (\d+)/.exec(content);
  if (msgOption) {
    msgLimit = parseInt(msgOption[1]);
  }
  if (vcOption) {
    vcLimit = parseInt(vcOption[1]);
  }

  if (content === 'all') msgLimit = -1;
  if (msgLimit < 0) {
    const members = server.guild.members;
    const langs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let mem of members.cache.values()) {
      if (mem) {
        const roles = mem.roles;
        if (roles.cache.has(NE)) ++langs[0];
        if (roles.cache.has(NJ)) ++langs[1];
        if (roles.cache.has(FE) || roles.cache.has(FE_J)) ++langs[2];
        if (roles.cache.has(FJ)) ++langs[3];
        if (roles.cache.has(OL)) ++langs[4];
        if (roles.cache.has(NE) && roles.cache.has(NJ)) ++langs[5];
        if (
          roles.cache.has(NJ) &&
          (roles.cache.has(FE) || roles.cache.has(FE_J))
        )
          ++langs[6];
        if (roles.cache.has(NJ) && roles.cache.has(OL)) ++langs[7];
        if (roles.cache.has(NE) && roles.cache.has(OL)) ++langs[8];
        if (
          roles.cache.has(FJ) &&
          (roles.cache.has(FE) || roles.cache.has(FE_J))
        )
          ++langs[9];
        ++langs[10];
        if (roles.cache.has(HJ)) ++langs[11];
        if (roles.cache.has(AJ)) ++langs[12];
      }
    }
    message.channel.send(
      `Out of ${langs[10]} people,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[12]} are Advanced Japanese\n${langs[4]} are Other Language\n${langs[11]} are Heritage Japanese\n\n${langs[5]} are NJ and NE\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`
    );
    return;
  }
  const users = server.users;
  const langs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let user in users) {
    const msgs = users[user].totalStats();
    const vcMins = users[user].voiceTime();
    if (msgs >= msgLimit || vcMins >= vcLimit * 60) {
      const mem = server.guild.member(user);
      if (mem) {
        const roles = mem.roles;
        if (roles.cache.has(NE)) ++langs[0];
        if (roles.cache.has(NJ)) ++langs[1];
        if (roles.cache.has(FE) || roles.cache.has(FE_J)) ++langs[2];
        if (roles.cache.has(FJ)) ++langs[3];
        if (roles.cache.has(OL)) ++langs[4];
        if (roles.cache.has(NE) && roles.cache.has(NJ)) ++langs[5];
        if (
          roles.cache.has(NJ) &&
          (roles.cache.has(FE) || roles.cache.has(FE_J))
        )
          ++langs[6];
        if (roles.cache.has(NJ) && roles.cache.has(OL)) ++langs[7];
        if (roles.cache.has(NE) && roles.cache.has(OL)) ++langs[8];
        if (
          roles.cache.has(FJ) &&
          (roles.cache.has(FE) || roles.cache.has(FE_J))
        )
          ++langs[9];
        ++langs[10];
        if (roles.cache.has(HJ)) ++langs[11];
        if (roles.cache.has(AJ)) ++langs[12];
      }
    }
  }
  message.channel.send(
    `Out of ${langs[10]} people who have sent more than ${msgLimit} messages or spent more than ${vcLimit} hours in the past 30 days,\n${langs[0]} are Native English\n${langs[1]} are Native Japanese\n${langs[2]} are Fluent English\n${langs[3]} are Fluent Japanese\n${langs[12]} are Advanced Japanese\n${langs[4]} are Other Language\n${langs[11]} are Heritage Japanese\n\n${langs[5]} are NJ and NE\n${langs[6]} are NJ and FE\n${langs[7]} are NJ and OL\n${langs[8]} are NE and OL\n${langs[9]} are FJ and FE`
  );
};
