import { TextChannel, MessageEmbed, MessageReaction, User } from "discord.js";

const paginate = async (
  channel: TextChannel,
  title: string,
  list: Record<string, [string, string, any]>,
  perPage: number,
  authorID: string
) => {
  const maxPageNum = Math.ceil(Object.keys(list).length / perPage) - 1;
  let currPage = 0;

  function getEmbed() {
    let description = "";
    for (let i = 0; i < perPage; i++) {
      const actualIndex = i + currPage * perPage;
      if (actualIndex >= Object.keys(list).length) break;
      description += list[actualIndex] + "\n";
    }
    const embed = new MessageEmbed()
      .setTitle(title)
      .setFooter(`${currPage + 1}/${maxPageNum + 1}`)
      .setColor(0x3a8edb)
      .setDescription(description || "Empty");
    return embed;
  }

  const message = await channel.send({ embeds: [getEmbed()] });

  if (maxPageNum > 0) {
    await message.react("◀");
    await message.react("▶");

    const filter = (reaction: MessageReaction, user: User) =>
      reaction.me && user.id === authorID;
    const collector = message.createReactionCollector({
      filter,
      time: 60_000, // 1 mintue
    });

    collector.on("collect", (r) => {
      switch (r.emoji.name) {
        case "▶":
          if (currPage < maxPageNum) {
            ++currPage;
            message.edit({ embeds: [getEmbed()] });
          }
          r.users.remove(authorID);
          collector.empty();
          break;
        case "◀":
          if (currPage > 0) {
            --currPage;
            message.edit({ embeds: [getEmbed()] });
          }
          r.users.remove(authorID);
          collector.empty();
          break;
      }
    });
    collector.on("end", () => {
      message.reactions.removeAll();
    });
  }
};

export default paginate;
