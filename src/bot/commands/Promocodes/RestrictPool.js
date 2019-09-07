'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class RestrictPool extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.restrict', 'glyphs restrict', 'Restrict or unrestrict a pool');
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?\\s*(?:--pool\\s?(.*))?`, 'i');
    this.usages = [
      {
        description: 'Restrict or unrestrict a pool',
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
    await this.settings.restrictPool(pool, enable === 'on');
    await this.messageManager.reply(message, 'Pool restriction set.');
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = RestrictPool;
