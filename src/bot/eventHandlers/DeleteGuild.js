'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class DeleteGuild extends Handler {
  /**
   * Construct handle
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.deleteGuild', 'guildDelete');
  }

  /**
   * delete channel from databse
   * @param {Discord.Guild} guild channel to delete from the database
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    await this.settings.removeGuild(guild);
    this.logger.debug(`Guild deleted : ${guild.name} (${guild.id})`);
  }
}

module.exports = DeleteGuild;
