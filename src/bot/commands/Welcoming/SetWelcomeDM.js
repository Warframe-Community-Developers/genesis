'use strict';

const Command = require('../../../models/Command');

class SetWelcomeDM extends Command {
  constructor(bot) {
    super(bot, 'settings.setwelcomedm', 'set welcome dm');
    this.usages = [
      { description: 'Set welcome message for this server in this channel to send to a user in DM', parameters: ['message'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?((.+|\\n)+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const match = message.strippedContent.match(this.regex)[1];
    if (match) {
      await this.settings.setWelcome(message, true, match.trim());
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetWelcomeDM;
