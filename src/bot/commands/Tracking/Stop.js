'use strict';

const Command = require('../../../models/Command');

const { getChannel } = require('../../../CommonFunctions.js');

/**
 * Untrack an event or item
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.stop', 'stop');
    this.usages = [
      { description: 'Untracks everything in a channel, effectively stopping tracking for the channel', parameters: [] },
    ];
    this.regex = new RegExp(`^${this.call}\\s*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');
    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message, message.guild.channels);

    this.settings.removeTypeNotifications(channel.id);
    this.settings.removeItemNotifications(channel.id);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Untrack;
