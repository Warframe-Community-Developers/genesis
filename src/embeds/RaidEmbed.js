'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const RaidStat = require('../tools/RaidStat.js');
const { assetBase } = require('../CommonFunctions');

/**
 * Generates simaris embeds
 */
class RaidStatEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Simaris} userStats - User raid stat json
   * @param {string} query - Query for this embed
   * @param {string} platform - Platform for the query
   */
  constructor(bot, userStats, query, platform) {
    super(bot);
    this.title = `Raid statistics for ${query}`;
    this.url = encodeURI(`https://${platform !== 'pc' ? `${platform}.` : ''}trials.wf/player/?user=${query}`);
    this.color = 0xaf5b4b;
    this.thumbnail = {
      url: `${assetBase}/NightmareRaidSekhara.png`,
    };
    const stats = {
      lor: new RaidStat(userStats, 'lor'),
      lornm: new RaidStat(userStats, 'lornm'),
      jv: new RaidStat(userStats, 'jv'),
      totals: {},
    };
    stats.total = new RaidStat();
    stats.total.makeTotals(stats.lor, stats.lornm, stats.jv);
    this.fields = [
      {
        name: 'Law of Retribution',
        value: stats.lor.toString(),
        inline: true,
      },
      {
        name: 'Law of Retribution: Nightmare',
        value: stats.lornm.toString(),
        inline: true,
      },
      {
        name: 'Jordas Verdict',
        value: stats.jv.toString(),
        inline: true,
      },
      {
        name: 'Totals',
        value: stats.total.toString(),
        inline: true,
      },
    ];

    this.footer.text = 'Evaluated by Cephalon Genesis, WFCD | Source: trials.wf';
  }
}

module.exports = RaidStatEmbed;
