import { BotCommand } from '@/types';
import { REGEX_USER } from '@/utils/regex';

const command: BotCommand = {
  name: 'voicemute',
  isAllowed: 'MUTE_MEMBERS',
  aliases: ['vm'],
  description: 'Voice mutes people',
  arguments: '<@person> [reason]',
  examples: [
    'vm @Geralt being too good at Japanese',
    'vm 284840842026549259 299335689558949888 shut up',
  ],
  normalCommand: async ({ commandContent, message }) => {
    let targets = message.mentions.members;
    let reason = commandContent.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
    // don't mute bots
    // for (let [, member] of targets) {
    //   await member.setMute(true, `by ${message.author.tag} Reason: ${reason}`);
    //   await member.roles.add('357687893566947329'); // Voice mute role
    //   let embed = new Discord.MessageEmbed();
    //   embed.title = `You have been voice muted in the English-Japanese Language Exchange server by ${message.author.tag}`;
    //   embed.description = `Reason: ${reason}`;
    //   embed.color = Number('0xEC891D');
    //   embed.setFooter(
    //     'Contact one of the mods if you need to discuss this issue.',
    //     message.author.avatarURL
    //   );
    //   embed.timestamp = new Date();
    //   await member.send({ embed });
    //   embed = new Discord.MessageEmbed();
    //   embed.setAuthor(
    //     `${member.user.tag} has been muted in voice chat`,
    //     member.user.avatarURL
    //   );
    //   embed.description = `Reason: ${reason}`;
    //   embed.color = Number('0xEC891D');
    //   embed.setFooter(`by ${message.author.tag}`, message.author.avatarURL);
    //   embed.timestamp = new Date();
    //   message.channel.send({ embed });
    // }
  },
};

export default command;
