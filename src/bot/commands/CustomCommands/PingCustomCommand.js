'use strict';

const Command = require('../../../models/Command');
const { getChannel } = require('../../../CommonFunctions.js');

class PingCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'settings.cc.ping', 'ping cc', 'Toggle whether or not custom commands mention either the user or the mentioned person.');
    this.usages = [
      { description: 'Change if this channel\'s use custom commands will ping', parameters: ['custom commands enabled'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message, message.guild.channels);
    if (!enable) {
      return this.sendToggleUsage(message);
    }
    enable = enable.trim();
    let allowPing = false;
    if (enable === 'on') {
      allowPing = true;
    }
    await this.settings.setChannelSetting(channel, 'settings.cc.ping', allowPing);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PingCustomCommand;
