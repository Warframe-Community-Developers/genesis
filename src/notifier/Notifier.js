'use strict';

const Wikia = require('node-wikia');
const util = require('util');

const exists = util.promisify(require('url-exists'));
const fetch = require('../tools/Fetcher');
const { embeds } = require('./NotifierUtils');
const Broadcaster = require('./Broadcaster');
const logger = require('../Logger');

const {
  createGroupedArray, apiBase, apiCdnBase, platforms,
} = require('../../CommonFunctions');


const warframe = new Wikia('warframe');

const syndicates = require('../assets/syndicates.json');
const I18n = require('../settings/I18n');

const i18ns = {};
require('../assets/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});

const beats = {};

const between = (activation, platform) => {
  const activationTs = new Date(activation).getTime();
  const isBeforeCurr = activationTs < beats[platform].currCycleStart;
  const isAfterLast = activationTs > (beats[platform].lastUpdate - 60000);
  return isBeforeCurr && isAfterLast;
};

async function getThumbnailForItem(query, fWiki) {
  if (query && !fWiki) {
    const fq = query
      .replace(/\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/ig, '$1')
      .trim().toLowerCase();
    const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}`);
    if (results.length) {
      const url = `${apiCdnBase}img/${results[0].imageName}`;
      if (await exists(url)) {
        return url;
      }
    }
    try {
      const articles = await warframe.getSearchList({ query: fq, limit: 1 });
      const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
      const item = Object.values(details.items)[0];
      return item && item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
    } catch (e) {
      logger.error(e);
    }
  }
  return undefined;
}

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

function buildNotifiableData(newData, platform) {
  const data = {
    acolytes: newData.persistentEnemies
      .filter(e => between(e.lastDiscoveredAt, platform)),
    alerts: newData.alerts
      .filter(a => !a.expired && between(a.activation, platform)),
    baro: newData.voidTrader && between(newData.voidTrader.activation, platform)
      ? newData.voidTrader
      : undefined,
    conclave: newData.conclaveChallenges
      .filter(cc => !cc.expired
        && !cc.rootChallenge && between(cc.activation, platform)),
    dailyDeals: newData.dailyDeals
      .filter(d => between(d.activation, platform)),
    events: newData.events
      .filter(e => !e.expired && between(e.activation, platform)),
    invasions: newData.invasions
      .filter(i => i.rewardTypes.length && between(i.activation, platform)),
    featuredDeals: newData.flashSales
      .filter(d => d.isFeatured && between(d.activation, platform)),
    fissures: newData.fissures
      .filter(f => !f.expired && between(f.activation, platform)),
    news: newData.news
      .filter(n => !n.primeAccess
        && !n.update && !n.stream && between(n.date, platform)),
    popularDeals: newData.flashSales
      .filter(d => d.isPopular && between(d.activation, platform)),
    primeAccess: newData.news
      .filter(n => n.primeAccess && !n.stream && between(n.date, platform)),
    sortie: newData.sortie && !newData.sortie.expired
      && between(newData.sortie.activation, platform)
      ? newData.sortie
      : undefined,
    streams: newData.news
      .filter(n => n.stream && between(n.activation, platform)),
    syndicateM: newData.syndicateMissions
      .filter(m => between(m.activation, platform)),
    tweets: newData.twitter ? newData.twitter.filter(t => t) : [],
    updates: newData.news
      .filter(n => n.update && !n.stream && between(n.activation, platform)),

    /* Cycles data */
    cetusCycleChange: between(newData.cetusCycle.activation, platform),
    earthCycleChange: between(newData.earthCycle.activation, platform),
    vallisCycleChange: between(newData.vallisCycle.activation, platform),
    cetusCycle: newData.cetusCycle,
    earthCycle: newData.earthCycle,
    vallisCycle: newData.vallisCycle,
    arbitration: newData.arbitration && between(newData.arbitration.activation, platform)
      ? newData.arbitration
      : undefined,
  };

  const ostron = newData.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetusCycle.bountyExpiry = ostron.expiry;
  }

  /* Nightwave */
  if (newData.nightwave) {
    const nWaveChallenges = newData.nightwave.activeChallenges
      .filter(challenge => challenge.active && between(challenge.activation, platform));
    data.nightwave = nWaveChallenges.length
      ? Object.assign({}, JSON.parse(JSON.stringify(newData.nightwave)))
      : undefined;
    if (data.nightwave) {
      data.nightwave.activeChallenges = nWaveChallenges;
    }
  }

  return data;
}

/**
 * Notifier for alerts, invasions, etc.
 *   TODO: remove dependence on 'bot', use something like https://github.com/spec-tacles/rest.js
 *     to leverage direct api routing/calls with ratelimit support
 *     use this in place of bot calls to queue up role changes,
 *     and separate the notifications from the rest of the bot functionality
 */
class Notifier {
  /**
   * * Set up essential notifier dependencies
   * * Get rid of all external pull-ins
   * rewrite to not use a bot client, but a direct api router
   * * Instantiate our own logger
   * * Instantiate our own db connection
   * @param {Genesis} bot instance of the bot.... this needs to be refactored/removed
   */
  constructor(bot) {
    this.bot = bot;
    this.settings = bot.settings;
    this.client = bot.client;
    this.broadcaster = new Broadcaster({
      client: bot.client,
      settings: this.settings,
      messageManager: bot.messageManager,
    });
    logger.info('[N] Ready');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: null,
      };
    });
  }

  /**
   * Start the notifier
   */
  async start() {
    for (const k of Object.keys(this.bot.worldStates)) {
      this.bot.worldStates[k].on('newData', async (platform, newData) => {
        logger.debug(`[N] Processing new data for ${platform}`);
        await this.onNewData(platform, newData);
      });
    }
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    beats[platform].currCycleStart = Date.now();
    if (!(newData && newData.timestamp)) return;

    // Set up data to notify
    const {
      alerts, dailyDeals, events, fissures,
      invasions, news, acolytes, sortie, syndicateM, baro,
      cetusCycle, earthCycle, vallisCycle, tweets, nightwave,
      cetusCycleChange, earthCycleChange, vallisCycleChange,
      featuredDeals, streams, popularDeals, primeAccess, updates, conclave,
    } = buildNotifiableData(newData, platform);


    // Send all notifications
    try {
      logger.debug('[N] sending new data...');
      await this.sendAcolytes(acolytes, platform);
      if (baro) {
        this.sendBaro(baro, platform);
      }
      if (conclave && conclave.length > 0) {
        this.sendConclaveDailies(conclave, platform);
        await this.sendConclaveWeeklies(conclave, platform);
      }
      if (tweets && tweets.length > 0) {
        this.sendTweets(tweets, platform);
      }
      this.sendDarvo(dailyDeals, platform);
      this.sendEvent(events, platform);
      this.sendFeaturedDeals(featuredDeals, platform);
      this.sendFissures(fissures, platform);
      this.sendNews(news, platform);
      this.sendStreams(streams, platform);
      this.sendPopularDeals(popularDeals, platform);
      this.sendPrimeAccess(primeAccess, platform);
      this.sendInvasions(invasions, platform);
      this.sendSortie(sortie, platform);
      this.sendSyndicates(syndicateM, platform);
      this.sendCetusCycle(cetusCycle, platform, cetusCycleChange);
      this.sendEarthCycle(earthCycle, platform, earthCycleChange);
      this.sendVallisCycle(vallisCycle, platform, vallisCycleChange);
      this.sendUpdates(updates, platform);
      this.sendAlerts(alerts, platform);
      await this.sendNightwave(nightwave, platform);
    } catch (e) {
      logger.error(e);
    } finally {
      beats[platform].lastUpdate = Date.now();
    }
  }

  async sendAcolytes(newAcolytes, platform) {
    await Promise.all(newAcolytes.map(async a => this.broadcaster.broadcast(new embeds.Enemy(
      this.bot,
      [a], platform,
    ), platform, `enemies${a.isDiscovered ? '' : '.departed'}`, null, 3600000)));
  }

  async sendAlerts(newAlerts, platform) {
    await Promise.all(newAlerts.map(async a => this.sendAlert(a, platform)));
  }

  async sendAlert(a, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Alert(this.bot, [a], platform, i18n);
      embed.locale = locale;
      try {
        const thumb = await getThumbnailForItem(a.mission.reward.itemString);
        if (thumb && !a.rewardTypes.includes('reactor') && !a.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        logger.error(e);
      } finally {
        // Broadcast even if the thumbnail fails to fetch
        await this.broadcaster.broadcast(embed, platform, 'alerts', a.rewardTypes, fromNow(a.expiry));
      }
    });
  }

  async sendArbitration(arbitration, platform) {
    if (!arbitration) return;

    for (const [locale, i18n] of i18ns) {
      const embed = new embeds.Arbitration(this.bot, arbitration, platform, i18n);
      embed.locale = locale;
      const type = `arbitration.${arbitration.enemy.toLowerCase()}.${arbitration.type.replace(/\s/g, '').toLowerCase()}`;
      await this.broadcaster.broadcast(embed, platform, type);
    }
  }

  async sendBaro(newBaro, platform) {
    const embed = new embeds.VoidTrader(this.bot, newBaro, platform);
    if (embed.fields.length > 25) {
      const fields = createGroupedArray(embed.fields, 15);
      fields.forEach(async (fieldGroup) => {
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        await this.broadcaster.broadcast(tembed, platform, 'baro', null);
      });
    } else {
      await this.broadcaster.broadcast(embed, platform, 'baro', null);
    }
  }

  async sendCetusCycle(newCetusCycle, platform, cetusCycleChange) {
    const minutesRemaining = cetusCycleChange ? '' : `.${Math.round(fromNow(newCetusCycle.expiry) / 60000)}`;
    const type = `cetus.${newCetusCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Cycle(this.bot, newCetusCycle),
      platform, type, null, fromNow(newCetusCycle.expiry),
    );
  }

  async sendConclaveDailies(newDailies, platform) {
    const dailies = newDailies.filter(challenge => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      const embed = new embeds.Conclave(this.bot, dailies, 'day', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.dailies', null, fromNow(dailies[0].expiry));
    }
  }

  async sendConclaveWeeklies(newWeeklies, platform) {
    const weeklies = newWeeklies.filter(challenge => challenge.category === 'week');
    if (weeklies.length > 0) {
      const embed = new embeds.Conclave(this.bot, weeklies, 'week', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.weeklies', null, fromNow(weeklies[0].expiry));
    }
  }

  async sendDarvo(newDarvoDeals, platform) {
    await Promise.all(newDarvoDeals.map(d => this.broadcaster.broadcast(new embeds.Darvo(this.bot, d, platform), platform, 'darvo', null, fromNow(d.expiry))));
  }

  async sendEarthCycle(newEarthCycle, platform, earthCycleChange) {
    const minutesRemaining = earthCycleChange ? '' : `.${Math.round(fromNow(newEarthCycle.expiry) / 60000)}`;
    const type = `earth.${newEarthCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Cycle(this.bot, newEarthCycle),
      platform, type, null, fromNow(newEarthCycle.expiry),
    );
  }

  async sendEvent(newEvents, platform) {
    await Promise.all(newEvents.map(e => this.broadcaster.broadcast(new embeds.Event(this.bot, e, platform), platform, 'operations', null, fromNow(e.expiry))));
  }

  async sendFeaturedDeals(newFeaturedDeals, platform) {
    await Promise.all(newFeaturedDeals.map(d => this.broadcaster.broadcast(new embeds.Sales(this.bot, [d], platform), platform, 'deals.featured', null, fromNow(d.expiry))));
  }

  async sendFissures(newFissures, platform) {
    await Promise.all(newFissures.map(fissure => this.sendFissure(fissure, platform)));
  }

  async sendFissure(fissure, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Fissure(this.bot, [fissure], platform, i18n);
      embed.locale = locale;
      const id = `fissures.t${fissure.tierNum}.${fissure.missionType.toLowerCase()}`;
      await this.broadcaster.broadcast(embed, platform, id, null, fromNow(fissure.expiry));
    });
  }

  async sendInvasions(newInvasions, platform) {
    await Promise.all(newInvasions.map(invasion => this.sendInvasion(invasion, platform)));
  }

  async sendInvasion(invasion, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Invasion(this.bot, [invasion], platform, i18n);
      embed.locale = locale;
      try {
        const reward = invasion.attackerReward.itemString || invasion.defenderReward.itemString;
        const thumb = await getThumbnailForItem(reward);
        if (thumb && !invasion.rewardTypes.includes('reactor') && !invasion.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        // do nothing, it happens
      } finally {
        await this.broadcaster.broadcast(embed, platform, 'invasions', invasion.rewardTypes, 86400000);
      }
    });
  }

  async sendNews(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News(this.bot, [i], undefined, platform), platform, 'news')));
  }

  async sendNightwave(nightwave, platform) {
    const makeType = (challenge) => {
      let type = 'daily';

      if (challenge.isElite) {
        type = 'elite';
      } else if (!challenge.isDaily) {
        type = 'weekly';
      }
      return `nightwave.${type}`;
    };

    if (!nightwave) return;
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      if (nightwave.activeChallenges.length > 1) {
        nightwave.activeChallenges.forEach(async (challenge) => {
          const nwCopy = Object.assign({}, nightwave);
          nwCopy.activeChallenges = [challenge];
          const embed = new embeds.Nightwave(this.bot, nwCopy, platform, i18n);
          embed.locale = locale;
          await this.broadcaster.broadcast(embed, platform,
            makeType(challenge), null, fromNow(challenge.expiry));
        });
      } else {
        const embed = new embeds.Nightwave(this.bot, nightwave, platform, i18n);
        embed.locale = locale;
        await this.broadcaster.broadcast(embed, platform, 'nightwave', null, fromNow(nightwave.expiry));
      }
    });
  }

  async sendPopularDeals(newPopularDeals, platform) {
    await Promise.all(newPopularDeals.map(d => this.broadcaster.broadcast(new embeds.Sales(this.bot, [d], platform), platform, 'deals.popular', null, 86400000)));
  }

  async sendPrimeAccess(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News(this.bot, [i], 'primeaccess', platform), platform, 'primeaccess')));
  }

  async sendSortie(newSortie, platform) {
    if (!newSortie) return;
    const embed = new embeds.Sortie(this.bot, newSortie, platform);
    try {
      const thumb = await getThumbnailForItem(newSortie.boss, true);
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
    } catch (e) {
      logger.error(e);
    } finally {
      await this.broadcaster.broadcast(embed, platform, 'sorties', null, fromNow(newSortie.expiry));
    }
  }

  async sendStreams(newStreams, platform) {
    await Promise.all(newStreams.map(i => this.broadcaster.broadcast(new embeds.News(this.bot, [i], undefined, platform), platform, 'streams')));
  }

  async checkAndSendSyndicate(embed, syndicate, timeout, platform) {
    if (embed.description && embed.description.length > 0 && embed.description !== 'No such Syndicate') {
      await this.broadcaster.broadcast(embed, platform, syndicate, null, timeout);
    }
  }

  async sendSyndicates(newSyndicates, platform) {
    if (!newSyndicates || !newSyndicates[0]) return;
    for (const {
      key, display, prefix, timeout, notifiable,
    } of syndicates) {
      if (notifiable) {
        const embed = new embeds.Syndicate(this.bot, newSyndicates, display, platform);
        const eKey = `${prefix || ''}${key}`;
        const deleteAfter = timeout || fromNow(newSyndicates[0].expiry);
        await this.checkAndSendSyndicate(embed, eKey, deleteAfter, platform);
      }
    }
  }

  async sendTweets(newTweets, platform) {
    await Promise.all(newTweets.map(t => this.broadcaster
      .broadcast(new embeds.Tweet(this.bot, t.tweets[0]), platform, t.id, null, 3600)));
  }

  async sendUpdates(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News(this.bot, [i], 'updates', platform), platform, 'updates')));
  }

  async sendVallisCycle(newCycle, platform, cycleChange) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Solaris(this.bot, newCycle),
      platform, type, null, fromNow(newCycle.expiry),
    );
  }
}

module.exports = Notifier;
