'use strict';

const Command = require('../../../models/Command');

const embed = {
  color: 0xBCC9EB,
  image: {
    url: 'https://warframestat.us/chart.low.png',
  },
};

/**
 * Displays the Warframe Progression Chart
 */
class Progression extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.progress', 'progress', 'Display Warframe Progression Chart');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.embed(message, embed, true, false, `Operator ${message.author.toString()}, the progression flowchart, at your request.`);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Progression;
