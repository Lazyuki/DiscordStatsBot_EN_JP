import { MessageEmbed, TextChannel } from "discord.js";
import Server from "../classes/Server";
import SimpleMessage from "../classes/SimpleMessage";
import { MOD_LOG } from "./ejlxConstants";

export const postLogs = (msg: SimpleMessage, server: Server) => {
  const embed = new MessageEmbed();
  const date = new Date(msg.time);
  embed.setAuthor(`${msg.atag} ID: ${msg.aid}`, msg.apfp);
  if (msg.del) {
    // message was deleted
    embed.title = `Message Deleted after ${msg.dur} seconds`;
    embed.description = msg.con;
    embed.color = Number("0xDB3C3C");
  } else {
    // message was edited
    embed.title = `Message Edited after ${msg.dur} seconds`;
    embed.addField("Before:", `${msg.con}`, false);
    embed.addField("After:", `${msg.acon}`, false);
    embed.color = Number("0xff9933");
  }
  embed.setFooter(`#${msg.ch}`);
  embed.timestamp = date.getTime();
  if (msg.img) {
    embed.addField("imgur link", msg.img, false);
    embed.setThumbnail(msg.img);
  }
  const chan = server.guild.channels.cache.get(MOD_LOG) as TextChannel; // #mod_log
  if (!chan) return;
  chan.send({ embeds: [embed] });
};
