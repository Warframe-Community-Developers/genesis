'use strict';

const Command = require('../../../models/Command');
const { createGroupedArray, createPageCollector } = require('../../../CommonFunctions');

class ListPools extends Command {
  constructor(bot) {
    super(bot, 'promocode.pools.managed', 'glyphs list managed', 'List claimed codes.');
    this.regex = new RegExp(`^${this.call}`, 'i');
    this.allowDM = true;
  }

  async run(message) {
    const pools = await this.settings.getPoolsUserManages(message.author);
    const longestName = pools.length ? pools.map(pool => pool.name)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    const longestId = pools.length ? pools.map(pool => pool.pool_id)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    pools.unshift({ pool_id: 'Pool Id', name: 'Pool Name', len: '# of Codes' });
    this.logger.debug(`name: ${longestName} | id: ${longestId}`);
    const groupPools = createGroupedArray(pools, 27);
    const poolOfPools = createGroupedArray(groupPools, 4);
    const pages = [];
    poolOfPools.forEach((poolGroup) => {
      const embed = {
        title: 'Managed Pools',
        color: 0xd30000,
        fields: poolGroup.map(group => ({
          name: '\u200B',
          value: group.map(pool => `\`${pool.pool_id.padEnd(longestId.length, '\u2003')} `
            + `| ${pool.name.padEnd(longestName.length, '\u2003')} | ${pool.len}\``).join('\n'),
        })),
      };
      pages.push(embed);
    });
    if (pages.length) {
      const msg = await this.messageManager.embed(message, pages[0], false, false);
      if (pages.length > 1) {
        await createPageCollector(msg, pages, message.author);
      }
    }
    if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
      message.delete({ timeout: 10000 });
    }

    return pools.length > 0
      ? this.messageManager.statuses.SUCCESS
      : this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListPools;
