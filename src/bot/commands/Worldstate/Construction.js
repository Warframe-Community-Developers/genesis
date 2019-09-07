'use strict';

const Command = require('../../../models/Command');
const EventEmbed = require('../../../embeds/ConstructionEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the current simaris target
 */
class Construction extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.construction', 'construction', 'Display current construction progress.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const embed = new EventEmbed(this.bot, await this.ws.get('constructionProgress', platform, ctx.language), platform);
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Construction;
