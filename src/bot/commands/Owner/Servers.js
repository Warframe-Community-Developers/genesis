'use strict';

const Command = require('../../../models/Command');

/**
 * Get a list of all servers
 */
class Servers extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.servers', 'servers', 'Get list of bot servers in file');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const fileContents = [];
    this.bot.client.guilds.array().forEach((guild) => {
      fileContents.push(`"${guild.name}","${guild.owner.user.username}#${guild.owner.user.discriminator}","${guild.id}"`);
    });

    await this.messageManager.sendFileToAuthor(message, Buffer.from(fileContents.join('\n'), 'ascii'), 'servers.csv', true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Servers;
