const abbrev = ['nj', 'jp', 'fj', 'ne', 'en', 'fe', 'ol', 'nu'];
const roleNames = ['Native Japanese', 'Native Japanese', 'Fluent Japanese',
        			        'Native English', 'Native English', 'Fluent English',
        			        'Other Language', 'New User'];
const roleIDs = ['196765998706196480', '196765998706196480', '270391106955509770',
         			   '197100137665921024', '197100137665921024', '241997079168155649',
         			   '248982130246418433', '249695630606336000'];
function exists(array, value) {
  return array.indexOf(value) >= 0;
};

function crossGet(src, dest, value) {
  return dest[src.indexOf(value)];
}

module.exports.alias = [
	'tag',
	't'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('MANAGE_ROLES')) return;
  var role = content.substr(0, 2);
	if (!exists(abbrev, role)) return; // no such role
  var newRole = crossGet(abbrev, roleIDs, role);
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
		if (memberID == undefined) return; // error
		member = await server.guild.fetchMember(memberID);
	}
  let oldRoles = member.roles;
  var oldRole = '';
  for (var r of oldRoles.keys()) {
    if (r == newRole) { // adding the same role.
      message.delete();
      message.channel.send(`Already tagged as \"${crossGet(abbrev, roleNames, role)}\"`);
      return;
    }
    if (exists(roleIDs, r)) {
      oldRole = r;
      await member.removeRole(r);
    }
  }
  await member.addRole(newRole);
  message.delete();
  if (oldRole != '' && oldRole != crossGet(abbrev, roleIDs, 'nu')){
  	message.channel.send(`${member.user.username}, you\'ve been tagged as \"${crossGet(abbrev, roleNames, role)}\" by ${message.author.username} instead of \"${crossGet(roleIDs, roleNames, oldRole)}\"!`);
  } else {
  	message.channel.send(`${member.user.username}, you\'ve been tagged as \"${crossGet(abbrev, roleNames, role)}\" by ${message.author.username}!`);
  };
};
