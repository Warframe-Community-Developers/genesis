'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, wikiBase } = require('../CommonFunctions');
const syndicates = require('../assets/syndicates.json');

const syndicateThumb = `${assetBase}/img/syndicate.png`;

const values = syndicates.map(s => s.display);

const makeJobs = (mission, numSyndMissions) => {
  if (mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewards = job.rewardPool instanceof Array ? job.rewardPool.join(' • ') : job.rewardPool;
      tokens.push(`\u200B \\⬆  ${totalStanding} - ${job.type} (${levels})`);
      if (job.rewardPool[0] && !job.rewardPool[0].startsWith('Pattern Mismatch.')) {
        tokens.push(`\\💰 ${rewards}\n`);
      }
    });

    if (numSyndMissions > 1) {
      tokens.push(`\n**Expires in ${mission.eta}**`);
    }

    return tokens.join('\n');
  }
  return undefined;
};

const makeMissionValue = (mission, syndMissions) => {
  if (!mission) {
    return 'No Nodes or Jobs Available';
  }
  const jobs = mission.jobs.length ? makeJobs(mission, syndMissions.length) : '';
  const nodes = mission.nodes.length ? `${mission.nodes.join('\n')}${syndMissions.length < 2 ? '' : `\n\n**Expires in ${mission.eta}**`}` : '';
  let value = 'No Nodes or Jobs Available';
  if (jobs.length) {
    value = jobs;
  } else if (nodes.length) {
    value = nodes;
  }
  return value;
};

/**
 * Generates syndicate embeds
 */
class SyndicateEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<SyndicateMission>} missions - The missions to be included in the embed
   * @param {string} syndicate - The syndicate to display the missions for
   * @param {string} platform - Platform
   * @param {boolean} skipCheck - True if skipping syndicate validity check.
   */
  constructor(bot, missions, syndicate, platform, skipCheck) {
    super(bot);

    // Set default fields
    this.color = 0xff0000;
    this.fields = [{
      name: 'No such Syndicate',
      value: `Valid values: ${values.join(', ')}`,
    }];
    this.url = `${wikiBase}${wikiBase.endsWith('/') ? '' : '/'}Syndicates`;
    this.thumbnail = {
      url: syndicateThumb,
    };

    const foundSyndicate = missions.length && values.find(v => syndicate
      && v.toLowerCase() === syndicate.toLowerCase());
    if (foundSyndicate || skipCheck) {
      let syndMissions;
      if (!skipCheck) {
        syndMissions = missions.filter(m => m.syndicate === foundSyndicate || foundSyndicate === 'all');
      } else {
        syndMissions = missions;
      }
      if (syndMissions.length) {
        this.title = `[${platform.toUpperCase()}] Syndicates`;
        this.color = 0x00ff00;
        if (syndMissions.length < 2) {
          this.title = `[${platform.toUpperCase()}] ${syndMissions[0].syndicate}`;
          this.footer.text = `Expires in ${syndMissions[0].eta}`;
          this.timestamp = syndMissions[0].expiry;
        }
        if (syndMissions.length < 2) {
          this.description = makeMissionValue(syndMissions[0], syndMissions);
          this.fields = undefined;
        } else {
          this.fields = syndMissions.map(m => ({
            name: syndMissions.length < 2 ? '\u200B' : m.syndicate,
            value: makeMissionValue(m, syndMissions),
            inline: !(m.jobs.length > 0),
          }));
        }
      }
    }
    this.bot = undefined;
  }
}

module.exports = SyndicateEmbed;
