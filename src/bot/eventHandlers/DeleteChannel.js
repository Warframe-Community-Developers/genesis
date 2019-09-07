'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class DeleteChannel extends Handler {
  /**
   * Construct handle
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.deleteChannel', 'channelDelete');
  }

  /**
   * delete channel from databse
   * @param {Discord.Channel} channel channel to delete from the database
   */
  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === 'voice') {
      return;
    }
    await this.settings.deleteChannel(channel);
    this.logger.debug(`Channel with id ${channel.id} deleted`);
  }
}

module.exports = DeleteChannel;
