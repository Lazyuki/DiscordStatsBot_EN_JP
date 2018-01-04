module.exports.name = 'deleteSelfAssignableRole';

module.exports.alias = [
  'delsar',
  'dsar'
];

module,exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '__Mods Only__ `,dsar <role emoji>` Delete self assignable roles.';

module.exports.command = (message, content, bot, server) => {
  if (server.sars[content]) {
    delete server.sars[content];
    message.channel.send(`Deleted \`${content}\`'s role`);
    return;
  }
  message.channel.send(`Not found \`${content}\``);
};
