'use strict';

const Command = require('../../../models/Command');

class ClearDefaultRoles extends Command {
  constructor(bot) {
    super(bot, 'settings.clearDefaultRoles', 'clear default roles', 'Clears all default roles for the server.');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.settings.deleteGuildSetting(message.guild, 'defaultRoles');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearDefaultRoles;
