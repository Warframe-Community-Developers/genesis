'use strict';

const Command = require('../../../models/Command');

class SetDefaultCategory extends Command {
  constructor(bot) {
    super(bot, 'settings.defaultcategory', 'set rooms category', 'Set whether or not to the bot should default rooms to being unlocked (public).');
    this.usages = [
      { description: 'Change the bot\'s default category for temp rooms. Defaults to none.', parameters: ['temp room default'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)?$`, 'i');
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
    const category = message.strippedContent.match(this.regex)[1];
    if (category && this.bot.client.channels.has(category.trim())) {
      await this.settings.setGuildSetting(message.guild, 'tempCategory', category);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'tempCategory');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetDefaultCategory;
