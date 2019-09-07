'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class SetMessageDeleteLog extends Command {
  constructor(bot) {
    super(bot, 'settings.msgDeleteLog', 'set message delete log', 'Sets the log channel for message deletions.');
    this.usages = [
      { description: 'Set the message delete log channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const logChannel = message.strippedContent.match(this.regex)[1];
    if (logChannel && this.bot.client.channels.has(logChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'msgDeleteLog', logChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'msgDeleteLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetMessageDeleteLog;
