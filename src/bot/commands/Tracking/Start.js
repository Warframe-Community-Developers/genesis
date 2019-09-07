'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the current guild's custom prefix
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.start', 'start', 'Lols');
    this.requiresAuth = true;
  }

  run(message) {
    this.messageManager.reply(message, 'That\'s so 2016, Operator, in 2017, Cephalon Genesis started using `/track` and that\'s all.\nCheck out <https://genesis.warframestat.us> for documentation.', true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Untrack;
