'use strict';

const Command = require('../../../models/Command');

/**
 * Leaves a server.
 */
class LeaveServer extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.leaveserver', 'leaveserver', 'Leave a specified server');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Tell the bot to leave a server, if it\'s cached',
        parameters: ['server id'],
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
    const serverid = message.strippedContent.match(this.regex)[1];
    if (this.bot.client.guilds.has(serverid)) {
      const guild = await this.bot.client.guilds.get(serverid).leave();
      this.messageManager.reply(message, `Left ${guild.name}`, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    message.reply('No such guild cached');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = LeaveServer;
