'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class SetUnBanLog extends Command {
  constructor(bot) {
    super(bot, 'settings.unbanLog', 'set unban log', 'Sets the log channel for unbans.');
    this.usages = [
      { description: 'Set the unban log channel', parameters: ['channel id'] },
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
      await this.settings.setGuildSetting(message.guild, 'unbanLog', logChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'unbanLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetUnBanLog;
