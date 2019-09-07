'use strict';

const Command = require('../../../models/Command');

class ClearWelcome extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomemessage', 'clear welcome message', 'Clears all messages (non-DM) for this guild.');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.settings.clearWelcomeForGuild(message.guild, false);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearWelcome;
