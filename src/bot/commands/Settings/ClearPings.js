'use strict';

const Command = require('../../../models/Command');

class ClearPings extends Command {
  constructor(bot) {
    super(bot, 'settings.clearpings', 'clear pings', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.settings.removePings(message.guild.id);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearPings;
