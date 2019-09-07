'use strict';

const fetch = require('../../../tools/Fetcher');
const Command = require('../../../models/Command');
const EnhancementEmbed = require('../../../embeds/EnhancementEmbed.js');
const { apiBase } = require('../../../CommonFunctions');


/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Arcane extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.arcane', 'arcane', 'Get information about an Arcane Enhancement');
    this.regex = new RegExp('^arcane(.+)?', 'i');
    this.usages = [
      {
        description: 'Get information about an Arcane Enhancement',
        parameters: ['enhancement name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let arcane = message.strippedContent.match(this.regex)[1];
    if (arcane) {
      arcane = arcane.trim().toLowerCase();
      const results = await fetch(`${apiBase}/arcanes/search/${arcane}`);
      if (results.length > 0) {
        this.messageManager.embed(message, new EnhancementEmbed(this.bot, results[0]), true, false);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    const enhancements = await fetch(`${apiBase}/arcanes`);
    this.messageManager.embed(
      message,
      new EnhancementEmbed(this.bot, undefined, enhancements), true, false,
    );
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Arcane;
