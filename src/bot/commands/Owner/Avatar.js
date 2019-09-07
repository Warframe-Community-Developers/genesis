'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the avatar for the bot
 */
class Avatar extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.avatar', 'avatar', 'Set Bot avatar');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set the bot\'s avatar url',
        parameters: ['avatar url'],
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
    const url = message.strippedContent.match(this.regex)[1];
    try {
      await this.bot.client.user.setAvatar(url);
      this.messageManager.reply(message, 'New avatar set!', true, true);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = Avatar;
