'use strict';

const { WebhookClient } = require('discord.js');
const io = require('socket.io-client');

const {
  embeds, rest, db, getThumbnailForItem, buildNotifiableData, beats, i18ns, fromNow,
} = require('./NotifierUtils');
// const Broadcaster = require('./Broadcaster');
const logger = require('../Logger');

const { createGroupedArray, platforms, apiBase } = require('../CommonFunctions');

const syndicates = require('../assets/syndicates.json');

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
    this.settings = db;
    this.client = rest;
    // this.broadcaster = new Broadcaster({
    //   client: bot.client,
    //   settings: this.settings,
    //   messageManager: bot.messageManager,
    // });

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: null,
      };
    });

    this.controlHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
    this.socket = io(apiBase);
  }

  /**
   * Start the notifier
   */
  async start() {
    this.controlHook.send('<:PeepoloveGenesis:547048445773348889> Notifier online');
    logger.info('Notifier initialized');

    this.socket.on('connected', (data) => {
      this.controlHook.send('<:PeepoloveGenesis:547048445773348889> Socket initialized');
    });

    this.socket.on('ws', ({
      event: type, platform, language = 'en', eventKey, data,
    }) => {
      const locale = Object.keys(i18ns).find(key => key.startsWith(language));
      const i18n = i18ns[locale] || i18ns.en;
      const deps = {
        platform, language, eventKey, locale, i18n,
      };
      // this.determineTarget(type).forEach((call) => {
      //   call.bind(this)(data, deps);
      // });

      this.logger.debug(`received a ${eventKey} : ${type} : ${language} : ${platform}`);
    });

    this.socket.on('tweet', async (tweet) => {
      if (tweet) {
        logger.debug(`received a ${tweet.id}`);
        platforms.forEach((platform) => {
          this.sendTweets(tweet, { eventKey: tweet.id, platform });
        });
      }
    });
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

  /**
   * Determine the targets for the new data
   * @param  {string} type type of new event
   * @returns {function[]}      functions to call
   */
  determineTarget(type) {
    const targets = [];
    switch (type) {
      case 'alerts':
        targets.push(this.sendAlert);
        break;
      case 'arbitration':
        targets.push(this.sendArbitration);
        break;
      case 'cetusCycle':
        targets.push(this.sendCetusCycle);
        break;
      case 'conclaveChallenges':
        targets.push(this.sendConclaveDailies, this.sendConclaveWeeklies);
        break;
      case 'dailyDeals':
        targets.push(this.sendDarvo);
        break;
      case 'earthCycle':
        targets.push(this.sendEarthCycle);
        break;
      case 'events':
        targets.push(this.sendEvent);
        break;
      case 'fissures':
        targets.push(this.sendFissure);
        break;
      case 'flashSales':
        targets.push(this.sendFeaturedDeal, this.sendPopularDeal);
        break;
      case 'invasions':
        targets.push(this.sendInvasion);
        break;
      case 'kuva':
        targets.push(this.sendKuva);
        break;
      case 'news':
        targets.push(this.sendNews, this.sendStreams, this.sendPrimeAccess);
        break;
      case 'nightwave':
        targets.push(this.sendNightwave);
        break;
      case 'persistentEnemies':
        targets.push(this.sendAcolytes);
        break;
      case 'sortie':
        targets.push(this.sendSortie);
        break;
      case 'syndicateMissions':
        targets.push(this.sendSyndicates);
        break;
      case 'vallisCycle':
        targets.push(this.sendVallisCycle);
        break;
      case 'voidTrader':
        targets.push(this.sendBaro);
        break;

      default:
        break;
    }
    return targets;
  }

  async sendAcolytes(newAcolytes, platform) {
    await Promise.all(newAcolytes.map(async a => this.broadcaster.broadcast(new embeds.Enemy(
      {},
      [a], platform,
    ), platform, `enemies${a.isDiscovered ? '' : '.departed'}`, null, 3600000)));
  }

  async sendAlerts(newAlerts, platform) {
    await Promise.all(newAlerts.map(async a => this.sendAlert(a, platform)));
  }

  async sendAlert(a, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Alert({}, [a], platform, i18n);
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
      const embed = new embeds.Arbitration({}, arbitration, platform, i18n);
      embed.locale = locale;
      const type = `arbitration.${arbitration.enemy.toLowerCase()}.${arbitration.type.replace(/\s/g, '').toLowerCase()}`;
      await this.broadcaster.broadcast(embed, platform, type);
    }
  }

  async sendBaro(newBaro, platform) {
    const embed = new embeds.VoidTrader({}, newBaro, platform);
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
      new embeds.Cycle({}, newCetusCycle),
      platform, type, null, fromNow(newCetusCycle.expiry),
    );
  }

  async sendConclaveDailies(newDailies, platform) {
    const dailies = newDailies.filter(challenge => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      const embed = new embeds.Conclave({}, dailies, 'day', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.dailies', null, fromNow(dailies[0].expiry));
    }
  }

  async sendConclaveWeeklies(newWeeklies, platform) {
    const weeklies = newWeeklies.filter(challenge => challenge.category === 'week');
    if (weeklies.length > 0) {
      const embed = new embeds.Conclave({}, weeklies, 'week', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.weeklies', null, fromNow(weeklies[0].expiry));
    }
  }

  async sendDarvo(newDarvoDeals, platform) {
    await Promise.all(newDarvoDeals.map(d => this.broadcaster.broadcast(new embeds.Darvo({}, d, platform), platform, 'darvo', null, fromNow(d.expiry))));
  }

  async sendEarthCycle(newEarthCycle, platform, earthCycleChange) {
    const minutesRemaining = earthCycleChange ? '' : `.${Math.round(fromNow(newEarthCycle.expiry) / 60000)}`;
    const type = `earth.${newEarthCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Cycle({}, newEarthCycle),
      platform, type, null, fromNow(newEarthCycle.expiry),
    );
  }

  async sendEvent(newEvents, platform) {
    await Promise.all(newEvents.map(e => this.broadcaster.broadcast(new embeds.Event({}, e, platform), platform, 'operations', null, fromNow(e.expiry))));
  }

  async sendFeaturedDeals(newFeaturedDeals, platform) {
    await Promise.all(newFeaturedDeals.map(d => this.broadcaster.broadcast(new embeds.Sales({}, [d], platform), platform, 'deals.featured', null, fromNow(d.expiry))));
  }

  async sendFissures(newFissures, platform) {
    await Promise.all(newFissures.map(fissure => this.sendFissure(fissure, platform)));
  }

  async sendFissure(fissure, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Fissure({}, [fissure], platform, i18n);
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
      const embed = new embeds.Invasion({}, [invasion], platform, i18n);
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
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News({}, [i], undefined, platform), platform, 'news')));
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
          const embed = new embeds.Nightwave({}, nwCopy, platform, i18n);
          embed.locale = locale;
          await this.broadcaster.broadcast(embed, platform,
            makeType(challenge), null, fromNow(challenge.expiry));
        });
      } else {
        const embed = new embeds.Nightwave({}, nightwave, platform, i18n);
        embed.locale = locale;
        await this.broadcaster.broadcast(embed, platform, 'nightwave', null, fromNow(nightwave.expiry));
      }
    });
  }

  async sendPopularDeals(newPopularDeals, platform) {
    await Promise.all(newPopularDeals.map(d => this.broadcaster.broadcast(new embeds.Sales({}, [d], platform), platform, 'deals.popular', null, 86400000)));
  }

  async sendPrimeAccess(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News({}, [i], 'primeaccess', platform), platform, 'primeaccess')));
  }

  async sendSortie(newSortie, platform) {
    if (!newSortie) return;
    const embed = new embeds.Sortie({}, newSortie, platform);
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
    await Promise.all(newStreams.map(i => this.broadcaster.broadcast(new embeds.News({}, [i], undefined, platform), platform, 'streams')));
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
        const embed = new embeds.Syndicate({}, newSyndicates, display, platform);
        const eKey = `${prefix || ''}${key}`;
        const deleteAfter = timeout || fromNow(newSyndicates[0].expiry);
        await this.checkAndSendSyndicate(embed, eKey, deleteAfter, platform);
      }
    }
  }

  async sendTweets(newTweets, platform) {
    await Promise.all(newTweets.map(t => this.broadcaster
      .broadcast(new embeds.Tweet({}, t.tweets[0]), platform, t.id, null, 3600)));
  }

  async sendUpdates(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News({}, [i], 'updates', platform), platform, 'updates')));
  }

  async sendVallisCycle(newCycle, platform, cycleChange) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Solaris({}, newCycle),
      platform, type, null, fromNow(newCycle.expiry),
    );
  }
}

module.exports = Notifier;
