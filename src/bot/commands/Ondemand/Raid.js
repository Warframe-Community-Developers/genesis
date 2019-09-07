'use strict';

const fetch = require('../../../tools/Fetcher');

const RaidEmbed = require('../../../embeds/RaidEmbed');
const Command = require('../../../models/Command');

/**
 * Returns search results from the Warframe wiki
 */
class Raid extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.stats.raid', 'raid', 'Get the raid record for a desired user, or for the calling user');
    this.regex = new RegExp(`^(?:${this.call}s?|trials?)\\s*(.+)?`, 'i');
    this.usages = [
      {
        description: 'Search for a users\'s raid stats',
        parameters: ['username'],
      },
    ];
    this.enabled = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    let query = message.strippedContent.match(this.regex)[1];
    if (!query || typeof query === 'undefined') {
      query = message.member ? message.member.displayName : message.author.username;
      query = query.replace('*', '');
    }
    this.logger.debug(`Searched for query: ${query}`);

    const url = encodeURI(`https://api.trials.wf/api/player/${ctx.platform}/${query}/completed`);
    const data = await (fetch(url));
    this.messageManager.embed(message, new RaidEmbed(
      this.bot,
      data, query, ctx.platform,
    ), true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Raid;
