'use strict';

const Command = require('../../../models/Command');
const AcolyteEmbed = require('../../../embeds/AcolyteEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the currently persistent enemies
 */
class Enemies extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.acolytes', 'acolyte', 'Display any currently active acolyte-style enemies.');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    await this.messageManager.embed(
      message,
      new AcolyteEmbed(this.bot, await this.ws.get('persistentEnemies', platform, ctx.language), platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Enemies;
