'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class AddGuildToDatabase extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.addGuild', 'guildCreate');
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
    await this.settings.addGuild([guild]);
    this.logger.debug(`Joined guild ${guild} (${guild.id}`);
  }
}

module.exports = AddGuildToDatabase;
