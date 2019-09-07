'use strict';

const Command = require('../../../models/Command');
const { getChannel } = require('../../../CommonFunctions.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteafterrespond', 'delete after respond', 'Set whether or not to allow the bot to delete commands and/or responses after responding.');
    this.usages = [
      { description: 'Change if the bot to delete commands and/or responses after responding in this channel', parameters: ['deleting enabled'] },
    ];
    this.regex = new RegExp('^delete\\s?after\\s?respond\\s?(all|command|respond|none)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$', 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let option = message.strippedContent.match(this.regex)[1];
    const usageEmbed = {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '\u200B',
          value: `${this.bot.prefix}${this.call} < all | command | respond | none > `,
        },
      ],
    };
    if (!option) {
      this.messageManager.embed(message, usageEmbed, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    option = option.trim();
    let delCall = false;
    let delResponse = false;
    let doNothing = false;
    switch (option) {
      case 'all':
        delCall = true;
        delResponse = true;
        break;
      case 'command':
        delCall = true;
        delResponse = false;
        break;
      case 'respond':
        delCall = false;
        delResponse = true;
        break;
      case 'none':
        delCall = false;
        delResponse = false;
        break;
      default:
        doNothing = true;
        break;
    }

    if (!doNothing) {
      const dirtyChannelParam = message.strippedContent.match(this.regex)[2];
      const channelParam = dirtyChannelParam ? dirtyChannelParam.trim().replace(/<|>|#/ig, '') : undefined;
      const channel = getChannel(channelParam, message);
      await this.settings.setChannelSetting(channel, 'delete_after_respond', delCall);
      await this.settings.setChannelSetting(channel, 'delete_response', delResponse);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.embed(message, usageEmbed, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = RespondToSettings;
