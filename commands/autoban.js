const Discord = require("discord.js");
const Util = require("../classes/Util.js");
module.exports.name = "autoban";

module.exports.alias = ["autoban", "smartban"];

module.exports.isAllowed = (message, server) => {
  return (
    server.guild.id == "189571157446492161" &&
    message.member.hasPermission("ADMINISTRATOR")
  );
};

module.exports.help =
  " `,autoban [num of users = 1]`\nCiri looks through recent messages and tries to figure out obvious trolls.\nCiri is not that smart, so she might suggest people who are not trolls.\n**DOUBLECHECK HER SUGGESTIONS**";

const REGEX_ENG = /[a-zA-Z0-9 !@#$%^&*()_\-+=`{}[\];:"'<>,.?/\\]/;
const ACTIVE_STAFF = "240647591770062848";
function getPenalty(message) {
  let penalty = 0;
  let content = message.content.replace(Util.REGEX_ID, "");
  content = content.replace(Util.REGEX_EMOJIS, "");
  if (content.test(Util.REGEX_URL)) {
    penalty += 2;
  }
  if (message.attachments && message.attachments.size > 0) {
    penalty += 2;
  }
  let other = 0;
  for (let l of content) {
    if (REGEX_ENG.test(l) || Util.REGEX_JPN.test(l)) {
      continue;
    }
    other += 1;
  }
  if (/^[A-Z ]+$/.test(content)) penalty += 1;
  if (message.cleanContent.includes("@everyone")) penalty += 3;
  if (message.mentions.roles.has(ACTIVE_STAFF)) penalty -= 3;
  if (content.test(/nigger/i)) penalty += 10;

  return penalty + other * 2;
}

function getInnatePenalty(member) {
  let penalty = 0;
  if (!member) return 7;
  const now = new Date().getTime();
  if (!member.joinedAt) {
    penalty += 5;
  } else if (now - member.joinedAt.getTime() < 86400000) {
    penalty += 5;
  } else if (now - member.joinedAt.getTime() > 7776000000) {
    // 3 months
    penalty -= 3;
  }
  if (
    [
      "189594666365091850",
      "543721608506900480",
      "755269385094168576",
      "250907197075226625",
    ].some((r) => member.roles.has(r))
  ) {
    penalty -= 5;
  } else if (member.roles.has("241997079168155649")) {
    // FE a bit trustworty
    penalty -= 2;
  } else if (
    ![
      "196765998706196480",
      "197100137665921024",
      "248982130246418433",
    ].some((r) => member.roles.has(r))
  ) {
    penalty += 5; // no lang role
  }

  return penalty;
}

module.exports.command = async (message, content, bot, server) => {
  const badPeople = [];
  const executor = message.author;
  let deleteDays = 1;
  const topN = parseInt(content, 10) || 1;
  const reason = `Issued by: ${executor.tag}. Troll/Spam (auto-detected by Ciri)`;

  const recentMessages = await message.channel.fetchMessages({ limit: 30 });
  const members = {};
  for (const m of recentMessages.array()) {
    const authorId = m.author.id;
    if (m.author.bot) continue;
    const penalty = getPenalty(m.content);
    if (authorId in members) {
      members[authorId] += penalty;
    } else {
      const innatePenalty = getInnatePenalty(m.member);
      members[authorId] = penalty + innatePenalty;
    }
    if (m.mentions.roles.has(ACTIVE_STAFF)) {
      if (m.mentions.users && m.mentions.users.size > 0) {
        for (const mid of m.mentions.users.keys()) {
          if (mid in members) {
            members[mid] += 10;
          } else {
            members[mid] = 10;
          }
        }
      }
    }
  }

  // punish duplicates
  const cache = [];
  recentMessages.array().forEach((m) => {
    if (cache.includes(m.content)) members[m.author.id] += 2;
    else cache.push(m.content);
  });

  console.log(JSON.stringify(members));

  const topNMemberIDs = Object.entries(members)
    .sort(([, a], [, b]) => b - a)
    .map((ent) => ent[0])
    .slice(0, topN);

  const bannedPeople = topNMemberIDs.map((id) => `<@${id}>`).join("\n");
  const failedBans = [];

  const banMessage = `<:hypergeralthinkban:443803651325034507>  **DOUBLE CHECK who you are banning**  <:hypergeralthinkban:443803651325034507>\n\n${bannedPeople}\n\nType \`confirm\`, \`confirm keep\` or \`cancel\``;
  await message.channel.send(banMessage);
  const filter = (m) => m.member.id == executor.id;
  const collector = message.channel.createMessageCollector(filter, {
    time: 45000,
  });
  collector.on("collect", async (m) => {
    const resp = m.content.toLowerCase();
    if (
      [
        "confirm",
        "confirm d",
        "confirm del",
        "confirm delete",
        "confirm k",
        "confirm keep",
      ].includes(resp)
    ) {
      if (resp.startsWith("confirm k")) {
        deleteDays = 0;
      }
      let someBan = false;
      await Promise.all(
        topNMemberIDs.map(async (id) => {
          try {
            await server.guild.ban(id, {
              days: deleteDays,
              reason,
            });
            someBan = true;
          } catch (e) {
            await message.channel.send(`Failed to ban <@${id}>`);
            failedBans.push(id);
          }
        })
      );
      if (someBan) {
        collector.stop("Banned");
      } else {
        collector.stop("Failed");
      }
      return;
    }
    if (resp == "cancel") {
      collector.stop("Cancelled");
      return;
    }
    message.channel.send(
      "Invalid response. Type `confirm`, `confirm keep` or `cancel`"
    );
  });
  collector.on("end", (collected, endReason) => {
    if (endReason == "Banned") {
      const actualBanned = badPeople.filter((p) => !failedBans.includes(p));
      message.channel.send("✅ Banned");
      const agt = server.guild.channels.get("755269708579733626");
      let embed = new Discord.RichEmbed();
      let date = new Date();
      embed.setAuthor(`${message.author.tag}`, message.author.avatarURL);
      embed.title = "Ban";
      embed.addField(
        "Banned users:",
        actualBanned.map((b) => `<@${b}>`).join("\n"),
        false
      );
      embed.addField("Ban reason:", "Trolling. (autoban)", false);
      embed.color = Number("0x000000");
      embed.setFooter(`In #${message.channel.name}`);
      embed.timestamp = date;
      agt.send({ embed });
      return;
    } else if (endReason == "Cancelled") {
      message.channel.send("❌ Cancelled");
      return;
    } else if (endReason == "Failed") {
      message.channel.send(
        "❌ Unable to ban them. Make sure the number of days is set appropriately and the ban message isn't too long"
      );
      return;
    } else {
      message.channel.send("❌ Failed to confirm");
      return;
    }
  });
};
