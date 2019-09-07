'use strict';

const fetch = require('../../../tools/Fetcher');
const Command = require('../../../models/Command');
const { csvToCodes, resolvePool } = require('../../../CommonFunctions');

const mdDiff = '```diff\n';
const cbEnd = '```';

const appendIfResponse = async (respondTo, response, messageManager, content) => {
  let newResponse;
  if (content.length > 2000) {
    // eslint-disable-next-line no-param-reassign
    content = `${content.substring(0, 1990)}[...]`;
  }
  if (response) {
    if (`${response ? `${response.content}\n============\n\n` : ''}${content}`.length > 1990) {
      newResponse = await messageManager.sendMessage(respondTo, content);
    } else {
      newResponse = await response.edit(`${response ? `${response.content}\n============\n\n` : ''}${content}`);
    }
  } else {
    newResponse = await messageManager.sendMessage(respondTo, content);
  }
  return newResponse;
};

class AddPromocode extends Command {
  constructor(bot) {
    super(bot, 'glyphs.addCode', 'glyphs import', 'Add a code.');
    this.ownerOnly = false;
    this.requiresAuth = true;
    this.allowDM = true;
    this.regex = new RegExp(`^${this.call}\\s*(?:--pool\\s(.*))?\\s?(pc|ps4|xb1|switch)?(.*)?`, 'i');
    this.usages = [
      {
        description: 'Add a single code',
        parameters: ['--pool <pool id>*', '<platform>', '<code>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
      {
        description: 'Bulk add codes. Export a single code to see the format.',
        parameters: ['--pool <pool id>*', '<platform>', '<code>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
  }

  async run(message) {
    if (message.channel.type !== 'dm') {
      await this.messageManager.reply(message, 'be careful calling this command in a public server channel, as it exposes the codes being added.');
    }
    if (message.attachments.first()) {
      return this.runAttachmentPath(message);
    }
    return this.runExplicitPath(message);
  }

  async runExplicitPath(message) {
    const pool = await resolvePool(message, this.settings, { checkRestriction: true });
    const platform = (message.strippedContent.match(/(pc|ps4|xb1|switch)/i) || [])[0] || 'pc';
    const code = (message.strippedContent.match(/(\w{4}-\w{4}-\w{4}-\w{4})/i) || [])[0];

    if (!code) {
      await this.messageManager.sendMessage(message, '\\❌ No code provided.');
      return this.messageManager.statuses.FAILURE;
    }
    if (!pool) {
      await this.messageManager.sendMessage(message, '\\❌ You either can\'t add to the provided pool or you don\'t manage any pools.');
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.addCode(pool, platform, message.author.id, null, null, code);
    return this.messageManager.statuses.FAILURE;
  }

  async runAttachmentPath(message) {
    const firstAttach = message.attachments.first();
    if (firstAttach.filename.indexOf('.json') === -1 && firstAttach.filename.indexOf('.csv') === -1) {
      await this.messageManager.reply(message, `\\❌ Hmm, Operator, I need a valid JSON or CSV file. Received: ${firstAttach.filename}`);
      return this.messageManager.statuses.FAILURE;
    }
    let codes;
    let response;
    try {
      const reqRes = await fetch(firstAttach.url);
      if (firstAttach.filename.indexOf('.json') > -1) {
        codes = JSON.parse(reqRes);
      } else if (firstAttach.filename.indexOf('.csv') > -1) {
        codes = csvToCodes(reqRes);
      }
    } catch (e) {
      await this.messageManager.sendMessage(message, '\\❌ Couldn\'t get file.');
      this.logger.debug(e);
      return this.messageManager.statuses.FAILURE;
    }
    // Check if the user has access to the pools... construct error messages
    if (!codes.length) {
      response = await appendIfResponse(message, response, this.messageManager, '\\❌ No codes to import');
      return this.messageManager.statuses.FAILURE;
    }
    const poolsInAttach = [];
    codes.forEach((code) => {
      if (!poolsInAttach.includes(code.id)) {
        poolsInAttach.push(code.id);
      }
    });
    const managedPools = (await this.settings.getPoolsUserManages(message.author))
      .map(pool => pool.pool_id);
    const unAllowedPools = [];
    poolsInAttach.forEach((attachedPool) => {
      if (!managedPools.includes(attachedPool)) {
        unAllowedPools.push(attachedPool);
      }
    });

    if (unAllowedPools.length) {
      response = await appendIfResponse(
        message, response, this.messageManager,
        `\\❌ The following pools will not be modified because you do not manage them: ${mdDiff}${unAllowedPools.map(pool => `- ${pool}`).join('\n')}${cbEnd}`,
      );
      codes = codes.filter(code => !unAllowedPools.includes(code.id));
    }

    const longestName = codes.map(pool => pool.id)
      .reduce((a, b) => (a.length > b.length ? a : b)).length;
    const addedCodeLines = codes.map(code => `+ ${code.id.padEnd(Number(longestName + 1), '\u2003')}| ${String(code.platform.toUpperCase()).padEnd(4, '\u2003')}| ${code.code}`);
    response = await appendIfResponse(message, response, this.messageManager, `\\✅ Importing ${addedCodeLines.length}`);
    codes.forEach((code) => {
      code.adder = message.author.id; // eslint-disable-line no-param-reassign
    });
    try {
      await this.settings.addCodes(codes);
      response = await appendIfResponse(message, response, this.messageManager, '\\✅ Codes successfully added!');
      return this.messageManager.statuses.SUCCESS;
    } catch (error) {
      this.logger.error(error);
      await appendIfResponse(message, response, this.messageManager, '\\❌ Failed to add codes.');
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = AddPromocode;
