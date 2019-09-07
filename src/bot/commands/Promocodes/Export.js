'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class ExportPromocodes extends Command {
  constructor(bot) {
    super(bot, 'promocode.export', 'glyphs export', 'Export promocodes the user has access to to a csv file.');
    this.usages = [
      {
        description: 'Export codes from a pool to a `.csv` file',
        parameters: ['--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = true;
    this.regex = new RegExp(`^${this.call}\\s?(.*)`);
  }

  async run(message) {
    let pools = await resolvePool(message, this.settings);
    if (typeof pools === 'string') {
      pools = [pools];
    }
    if (!pools || pools.length === 0) {
      this.messageManager.reply(message, '**[Denied]** You manage no pools or need to specify because there are multiple.');
      return this.messageManager.statuses.FAILURE;
    }
    const codes = await this.settings.getCodesInPools(pools);
    const fileContents = codes.map(code => `"${code.id}","${code.platform}","${code.addedBy}","${code.addedOn}",${code.grantedTo},${code.grantedBy},${code.grantedOn},${code.code}`);
    if (message.channel.type !== 'dm') {
      this.messageManager.reply(message, 'Check your direct messages for the file.', true, true);
    }
    const contents = fileContents.join('\n');
    this.messageManager.sendFileToAuthor(message, Buffer.from(contents, 'ascii'), 'codes.csv', true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ExportPromocodes;
