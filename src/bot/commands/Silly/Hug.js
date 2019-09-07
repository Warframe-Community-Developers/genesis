'use strict';

const Command = require('../../../models/Command');

/**
 * Hug Genesis
 */
class Hug extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'silly.hug', 'hug', 'Hug Genesis');
  }

  run(message) {
    this.messageManager.reply(message, '```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```', false, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Hug;
