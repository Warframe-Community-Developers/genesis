'use strict';

const Command = require('../../../models/Command');

const { captures: { user } } = require('../../../CommonFunctions');

class DeleteUser extends Command {
  constructor(bot) {
    super(bot, 'core.blacklist.remove', 'bl remove', 'Remove a user from the blacklist');
    this.requiresAuth = true;
    this.regex = new RegExp(`^${this.call}\\s?${user}?`);
    this.allowDM = false;
    this.usages = [
      { description: 'Remove a user from this server\'s blacklist.', parameters: ['user'] },
      {
        description: 'Remove a user from the global blacklist. Owner only. `--global` or `-g` specify global',
        parameters: ['user', '--global', '-g'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx     Message/command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    const global = /--?g(?:lobal)?/ig.test(message.strippedContent) && ctx.isOwner;
    const matches = message.strippedContent.replace('--global', '').replace('-g', '').trim().match(new RegExp(user, 'i'));

    if (!matches || !matches.length) {
      this.messageManager.reply(message, 'No user provided.', true, true);
      return this.messageManager.statuses.FAILURE;
    }
    const userId = matches[1];

    if (userId && message.guild) {
      await this.settings.deleteBlacklistedUser(
        userId,
        message.guild ? message.guild.id : 0,
        global,
      );
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.reply(message, 'No such user.', true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteUser;
