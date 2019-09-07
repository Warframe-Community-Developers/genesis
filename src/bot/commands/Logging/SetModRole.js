'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class SetModRole extends Command {
  constructor(bot) {
    super(bot, 'settings.setModRole', 'set mod', 'Sets the server\'s mod role.');
    this.usages = [
      { description: 'Change the configured mod role', parameters: ['mod role id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.role}?$`, 'i');
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
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.has(roleId.trim())) {
      await this.settings.setGuildSetting(message.guild, 'modRole', roleId);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'modRole');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetModRole;
