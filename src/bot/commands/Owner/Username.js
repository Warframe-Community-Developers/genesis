'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the username for the bot
 */
class Username extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.username', 'username', 'Set Bot username');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set the bot\'s username',
        parameters: ['username'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const username = message.strippedContent.match(this.regex)[1];
    try {
      await this.bot.client.user.setUsername(username);
      this.messageManager.reply(message, 'New Username set!', true, true);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = Username;
