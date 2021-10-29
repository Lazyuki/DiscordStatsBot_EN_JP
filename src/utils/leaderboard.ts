import { TextChannel, MessageEmbed, User } from "discord.js";
import { Bot } from "../types";
import paginate from "./paginate";

export const userLeaderboard = async (
  channel: TextChannel,
  embed: MessageEmbed,
  list: Record<string, [string, string, any]>,
  authorID: string,
  searchUser: User,
  format: (val: string) => string,
  bot: Bot
) => {
  let foundRank = 0;
  // tslint:disable-next-line:forin
  for (const i in list) {
    const [key, val] = list[i];
    const rank = parseInt(i, 10) + 1;
    if (rank > 25) {
      if (foundRank) break;
      if (key === searchUser.id) {
        foundRank = rank;
        break;
      } else {
        continue;
      }
    } else {
      const user = await bot.users.fetch(key);
      if (!user) continue;
      list[i][2] = user.username;
      if (key === searchUser.id) foundRank = rank;
      embed.addField(rank + ") " + user.username, format(val), true);
    }
  }
  if (foundRank)
    embed.setFooter(
      `${foundRank}) ${searchUser.username}: ${format(list[foundRank - 1][1])}`
    );

  const msg = await channel.send({ embeds: [embed] });
  let reloadingNum = 0;
  async function reload(pageNum: number) {
    const myReloadingNum = ++reloadingNum;
    for (let i = 0; i < 25; i++) {
      const rank = i + pageNum * 25;
      if (list[rank]) {
        // tslint:disable-next-line:prefer-const
        let [key, val, username] = list[rank];
        if (!username) {
          const user = await bot.users.fetch(key);
          if (!user) continue;
          username = user.username;
          list[rank][2] = username;
        }
        if (reloadingNum === myReloadingNum)
          embed.fields[i] = {
            name: `${rank + 1}) ${username}`,
            value: format(val),
            inline: true,
          };
        else break;
      } else {
        embed.fields.length = i;
        break;
      }
    }
    msg.edit({ embeds: [embed] });
  }
  // paginate(msg.channel as TextChannel, title, list, authorID, foundRank, reload);
};
