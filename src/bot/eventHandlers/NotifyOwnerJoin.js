'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class NotifyOwnerJoin extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.notifyowner', 'guildCreate');
    this.channelTimeout = 60000;
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Guild} guild guild to add to the database
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    const bots = guild.members.filter(member => member.user.bot);
    const isOverLimit = ((bots.size / guild.memberCount) * 100) >= 80;

    try {
      if (!isOverLimit) {
        const prefix = await this.settings.getChannelSetting(guild.channels.first(), 'prefix');
        guild.owner.send(`${this.client.user.username} has been added `
                         + `to ${guild.name} and is ready\n Type `
                         + `\`${prefix}help\` for help`);
      } else {
        guild.owner.send(`Your guild **${guild.name}** is over the bot-to-user ratio.\nGenesis will now leave.\nIf you want to keep using ${this.client.user.username} please invite more people or kick some bots.`);
        guild.leave();
      }
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}

module.exports = NotifyOwnerJoin;
