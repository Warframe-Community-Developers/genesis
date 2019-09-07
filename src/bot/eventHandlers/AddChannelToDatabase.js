'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class AddChannelToDatabase extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.addChannel', 'channelCreate');
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Channel} channel channel to add to the database
   */
  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === 'voice') {
      return;
    }
    if (channel.type === 'text') {
      try {
        await this.settings.addGuildTextChannel(channel);
        this.logger.debug(`Text channel ${channel.name} (${channel.id}) created in guild `
          + `${channel.guild.name} (${channel.guild.id})`);
      } catch (err) {
        await this.settings.addGuild(channel.guild);
        this.settings.addGuildTextChannel(channel);
      }
    } else {
      await this.settings.addDMChannel(channel);
      this.logger.debug(`DM channel with id ${channel.id} created`);
    }
  }
}

module.exports = AddChannelToDatabase;
