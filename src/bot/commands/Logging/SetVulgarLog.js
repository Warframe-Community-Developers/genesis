'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class SetVulgarLog extends Command {
  constructor(bot) {
    super(bot, 'settings.vulgarLog', 'set vulgar log', 'Sets the log channel for vulgar names of new members.');
    this.usages = [
      { description: 'Set the vulgarity log channel', parameters: ['channel id'] },
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
    const vulgarLogChannel = message.strippedContent.match(this.regex)[1];
    if (vulgarLogChannel && this.bot.client.channels.has(vulgarLogChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'vulgarLog', vulgarLogChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'vulgarLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetVulgarLog;
