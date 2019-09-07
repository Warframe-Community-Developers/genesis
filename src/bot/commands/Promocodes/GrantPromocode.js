'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class GrantPromocode extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.grant', 'glyphs grant', 'Grant a code.');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?\\s?(pc|ps4|xb1|switch)?\\s?(?:<@([0-9]{0,20})>)?`, 'i');
    this.usages = [
      {
        description: 'Grant a code to a user from a specific pool',
        parameters: ['--pool <pool id>*', '<platform>', '<user mention or id>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const pool = await resolvePool(message, this.settings);
    const platform = message.strippedContent.match(/(pc|ps4|xb1|switch)/i)[0] || 'pc';
    const user = message.strippedContent.match(/([0-9]{16,20})/i)[0];
    if (!pool) {
      this.messageManager.reply(message, 'You can either not manage provided pool, or provided pool doesn\'t exist.');
      return this.messageManager.statuses.FAILURE;
    }
    if (!user || !this.bot.client.users.has(user)) {
      this.messageManager.reply(message, 'A user to grant to must be specified');
      return this.messageManager.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    const [{ code, grantedTo }] = await this.settings.getNextCodeInPool(platform, pool);
    if (typeof code === 'undefined') {
      this.messageManager.reply(message, 'No more codes are available, contact your code provider or the owner of the pool to add more.');
      return this.messageManager.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    if (grantedTo === null) {
      if (await this.settings.hasCodeInPool(message.author, pool)) {
        this.messageManager.reply(message, `<@${message.author.id}> already has a code from ${pool}`);
        return this.messageManager.statuses.FAILURE;
      }

      await this.settings.grantCode(code, user, message.author.id, platform);
      this.messageManager.reply(message, `Code granted to <@${user}> from ${pool} on ${platform}`);
      this.messageManager.sendDirectMessageToUser(this.bot.client.users.get(user), `You've been granted a code for ${pool} on ${platform}.
        \nUse \`${ctx.prefix}glyphs list claimed\` in this direct message to see your new code.
        \n**If you are receiving this in error, or the code is for the wrong platform,** contact ${message.member} immediately with the code so it can be revoked and a new code granted.`);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = GrantPromocode;
