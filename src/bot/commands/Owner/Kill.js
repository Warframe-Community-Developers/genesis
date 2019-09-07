'use strict';

const Command = require('../../../models/Command');

/**
 * Restarts the bot by exiting with 27
 */
class Kill extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.kill', 'kill', 'Kill current shard');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run() {
    this.logger.fatal('Killing bot shard');
    process.exit(255);
    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = Kill;
