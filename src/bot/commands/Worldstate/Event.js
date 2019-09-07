'use strict';

const Command = require('../../../models/Command');
const EventEmbed = require('../../../embeds/EventEmbed.js');
const { createPageCollector, captures } = require('../../../CommonFunctions');


/**
 * Displays the current event statuses
 */
class Event extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.events', 'events', 'Display current events.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = (platformParam || ctx.platform).toLowerCase();
    const events = await this.ws.get('events', platform, ctx.language);
    if (events.length > 0) {
      const pages = events.map(event => new EventEmbed(this.bot, event, platform.toUpperCase()));
      const msg = await this.messageManager.embed(message, pages[0], true, false);
      if (pages.length > 1) {
        await createPageCollector(msg, pages, message.author);
      }
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.embed(message, new EventEmbed(
      this.bot,
      undefined, platform.toUpperCase(),
    ), true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Event;
