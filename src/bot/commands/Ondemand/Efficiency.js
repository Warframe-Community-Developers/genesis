'use strict';

const Command = require('../../../models/Command');
const { assetBase } = require('../../../CommonFunctions');

const efficiencyChart = `${assetBase}/img/efficiency-chart.png`;

/**
 * Displays the Warframe efficincy/duration Chart
 */
class Efficiency extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.efficiency', 'efficiency', 'Display Warframe Efficiency Chart');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.sendFile(
      message,
      `Operator ${message.author.toString()}, the efficiency table, at your request.`,
      efficiencyChart, 'efficiency.png', true,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Efficiency;
