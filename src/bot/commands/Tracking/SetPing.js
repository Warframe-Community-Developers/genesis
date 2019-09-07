'use strict';

const Command = require('../../../models/Command');
const {
  trackablesFromParameters,
  sendTrackInstructionEmbeds,
  captures,
} = require('../../../CommonFunctions');

class SetPing extends Command {
  constructor(bot) {
    super(bot, 'settings.setping', 'set ping');
    this.usages = [
      { description: 'Set ping for an event or item', parameters: ['event or reward', '@role or user mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s*(${captures.trackables}(.+)?)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const regex = new RegExp(`${captures.trackables}(.+)?`, 'i');
    const match = message.content.match(regex);
    if (message.channel.type === 'dm') {
      this.messagemanager.reply(message, 'Operator, you can\'t do that privately, it\'s the same as directly messaging you anyway!');
      return this.messageManager.statuses.FAILURE;
    }
    if (match) {
      const trackables = trackablesFromParameters(match[1].trim().split(' '));
      const eventsAndItems = [].concat(trackables.events).concat(trackables.items);
      const pingString = match[2] ? match[2].trim() : undefined;

      if (!eventsAndItems.length) {
        await sendTrackInstructionEmbeds({
          message,
          prefix: ctx.prefix,
          call: this.call,
          settings: this.settings,
          mm: this.messageManager,
        });
        return this.messageManager.statuses.FAILURE;
      }
      const results = [];
      eventsAndItems.forEach((eventOrItem) => {
        if (eventOrItem) {
          if (!pingString) {
            this.logger.debug('No ping string.');
            results.push(this.settings.removePing(message.guild, eventOrItem));
          } else {
            this.logger.debug(`${pingString} to be set for ${eventOrItem}`);
            results.push(this.settings.setPing(message.guild, eventOrItem, pingString));
          }
        }
      });
      Promise.all(results);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await sendTrackInstructionEmbeds({
      message,
      prefix: ctx.prefix,
      call: this.call,
      settings: this.settings,
      mm: this.messageManager,
    });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetPing;
