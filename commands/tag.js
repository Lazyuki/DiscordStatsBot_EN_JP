const roles = {'nj':'196765998706196480', // 'fj': '270391106955509770',
         			 'ne': '197100137665921024', 'fe': '241997079168155649',
         			 'ol': '248982130246418433', 'nu': '249695630606336000' };

module.exports.alias = [
	'tag',
	't'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('MANAGE_ROLES')) return;
  var role = content.substr(0, 2);
	if (!roles[role]) return; // no such role
	var member;
	var mentions = message.mentions.members;
	if (mentions.size != 0) {
    member = mentions.first();
  } else {
		var memberID;
		if (content.substr(3) == '2') {
			memberID = server.newUsers[1];
		} else if (content.substr(3) == '3') {
			memberID = server.newUsers[2];
		} else {
			memberID = server.newUsers[0];
	  }
		if (member == undefined) return; // error
		member = await server.guild.fetchMember(memberID);
	}
	await member.removeRole(roles['nu']);
	await member.addRole(roles[role]);
	message.channel.send(member.user.username + ', you are tagged!');
};
