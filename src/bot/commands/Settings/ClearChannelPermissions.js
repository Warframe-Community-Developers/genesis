'use strict';

const Command = require('../../../models/Command');
const { getChannels } = require('../../../CommonFunctions.js');

class ClearChannelPermissions extends Command {
  constructor(bot) {
    super(bot, 'settings.clearChannelPerms', 'clear permissions', 'Clear channel permisions for this or specified room, or guild');
    this.regex = new RegExp(`^${this.call}(?:\\s*((?:(?:<#)?\\d+(?:>)?)|current|all|guild))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
    this.blacklistable = false;
  }

  async run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = getChannels(channelParam.trim(), message);
    if (channels.length) {
      const results = [];
      for (const channel of channels) {
        results.push(this.settings.removeChannelPermissions(channel.id));
      }
      await Promise.all(results);
    } else {
      await this.settings.removeGuildPermissions(message.guild);
    }
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearChannelPermissions;
