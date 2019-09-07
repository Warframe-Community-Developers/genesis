'use strict';

const Command = require('../../../models/Command');
const { getChannel, captures } = require('../../../CommonFunctions');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.respondSettings', 'respond to settings', 'Toggle whether or not the bot tells you when settings change from your command.');
    this.usages = [
      { description: 'Change if this channel has settings changes responded in it', parameters: ['response enabled'] },
    ];
    this.regex = new RegExp(`^respond(?:\\sto)?\\s?settings\\s?(on|off)?(?:\\s+in\\s+(${captures.channel}|here))?$`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message);
    if (!enable) {
      return this.sendToggleUsage(message);
    }
    enable = enable.trim();
    let enableResponse = false;
    if (enable === 'on') {
      enableResponse = true;
    }
    await this.settings.setChannelSetting(channel, 'respond_to_settings', enableResponse);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = RespondToSettings;
