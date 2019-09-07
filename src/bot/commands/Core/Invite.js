'use strict';

const Command = require('../../../models/Command');

/**
 * Sends the user an OAuth or other URL for inviting the bot (User configurable env: INVITE_URL)
 */
class Invitation extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.invitation', 'invitation', 'Send Invitation Link to Authorize Bot to Join a Server');
    this.regex = new RegExp(`^${this.call}$`, 'ig');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.reply(message, process.env.INVITE_URL || 'No Invite Set', true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Invitation;
