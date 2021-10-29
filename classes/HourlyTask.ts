function hourlyTask(bot) {
  for (let s in bot.servers) {
    bot.servers[s].save(false); // saves to the .restore.json
    bot.servers[s].hourly(); //hourly task
  }
}

export default hourlyTask;
