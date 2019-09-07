'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class SetPoolPublic extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.public', 'glyphs public', 'Make a pool public or private');
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?\\s*(?:--pool\\s?(.*))?`, 'i');
    this.usages = [
      {
        description: 'Make a pool public or private',
        parameters: ['<on | off>', '--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message);
    }
    enable = enable.trim();

    const pool = await resolvePool(message, this.settings);

    if (typeof pool === 'undefined') {
      this.messageManager.reply(message, 'You either manage none or too many pools. Please specify the pool ID.');
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.setPoolPublic(pool, enable === 'on');
    await this.messageManager.reply(message, 'Pool publicity set.');
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetPoolPublic;
