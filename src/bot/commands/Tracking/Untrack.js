'use strict';

const Command = require('../../../models/Command');
const {
  getEventsOrItems,
  trackablesFromParameters,
  getChannel,
  sendTrackInstructionEmbeds,
  captures,
  checkAndMergeEmbeds,
  setupPages,
  constructItemEmbeds,
  constructTypeEmbeds,
} = require('../../../CommonFunctions');

/**
 * Untrack an event or item
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.untrack', 'untrack');
    this.usages = [
      { description: 'Show tracking command for untracking events', parameters: [] },
      { description: 'Untrack an event or events', parameters: ['event(s) to untrack'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s*${captures.trackables}*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  async run(message, ctx) {
    const unsplitItems = getEventsOrItems(message);
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');

    if (unsplitItems.length === 0) {
      return this.failure(message, ctx.prefix);
    }
    const trackables = trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      return this.failure(message, ctx.prefix);
    }
    trackables.events = trackables.events
      .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
      .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;

    const channel = getChannel(channelParam, message);
    if (trackables.events.length) {
      await this.settings.untrackEventTypes(channel, trackables.events);
    }
    if (trackables.items.length) {
      await this.settings.untrackItems(channel, trackables.items);
    }
    if (ctx.respondToSettings) {
      await this.notifyCurrent(channel, message);
    }
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  async notifyCurrent(channel, message) {
    const pages = [];
    const items = await this.settings.getTrackedItems(channel);
    const trackedItems = constructItemEmbeds(items);
    const events = await this.settings.getTrackedEventTypes(channel);
    const trackedEvents = constructTypeEmbeds(events);
    checkAndMergeEmbeds(pages, trackedItems);
    checkAndMergeEmbeds(pages, trackedEvents);

    if (pages.length) {
      return setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    }
    return this.messageManager.sendMessage(message, 'Nothing Tracked', true, true);
  }

  async failure(message, prefix) {
    await sendTrackInstructionEmbeds({
      message,
      prefix,
      call: this.call,
      settings: this.settings,
      mm: this.messageManager,
    });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Untrack;
