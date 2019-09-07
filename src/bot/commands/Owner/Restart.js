'use strict';

const Command = require('../../../models/Command');

/**
 * Restarts the bot by exiting with 0
 */
class Restart extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.restart', 'restart', 'Restart bot');
    this.ownerOnly = true;
    this.blacklistable = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run() {
    this.logger.debug('Forcing Restart');
    process.exit(0);
    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = Restart;
