'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the avatar for the bot
 */
class ForceGarbageCollection extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.garbagecollection', 'fgc', 'Force garbage collection');
    this.ownerOnly = true;
  }

  /**
   * Force a garbage collection run on the process
   * @returns {string} success status
   */
  async run() {
    try {
      if (global.gc) {
        global.gc();
      } else {
        return this.messageManager.statuses.FAILURE;
      }
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = ForceGarbageCollection;
