'use strict';

const Wikia = require('node-wikia');
const util = require('util');
const exists = util.promisify(require('url-exists'));
const rest = require('@spectacles/rest')(process.env.TOKEN);

const logger = require('../Logger');
const Database = require('../settings/Database');
const fetch = require('../tools/Fetcher');
const { apiBase, apiCdnBase } = require('../CommonFunctions');
const I18n = require('../settings/I18n');

const warframe = new Wikia('warframe');

const i18ns = {};
require('../assets/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

/* eslint-disable global-require */
const embeds = {
  Alert: require('../embeds/AlertEmbed'),
  Arbitration: require('../embeds/ArbitrationEmbed'),
  Conclave: require('../embeds/ConclaveChallengeEmbed'),
  Darvo: require('../embeds/DarvoEmbed'),
  Enemy: require('../embeds/EnemyEmbed'),
  Event: require('../embeds/EventEmbed'),
  Fissure: require('../embeds/FissureEmbed'),
  Invasion: require('../embeds/InvasionEmbed'),
  News: require('../embeds/NewsEmbed'),
  Sales: require('../embeds/SalesEmbed'),
  Sortie: require('../embeds/SortieEmbed'),
  Tweet: require('../embeds/TweetEmbed'),
  Syndicate: require('../embeds/SyndicateEmbed'),
  VoidTrader: require('../embeds/VoidTraderEmbed'),
  Cycle: require('../embeds/EarthCycleEmbed'),
  Solaris: require('../embeds/SolarisEmbed'),
  Nightwave: require('../embeds/NightwaveEmbed'),
};

const dbSettings = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB || 'genesis',
};

const db = new Database(dbSettings);

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

const beats = {};

const between = (activation, platform) => {
  const activationTs = new Date(activation).getTime();
  const isBeforeCurr = activationTs < beats[platform].currCycleStart;
  const isAfterLast = activationTs > (beats[platform].lastUpdate - 60000);
  return isBeforeCurr && isAfterLast;
};

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

module.exports = {
  rest,
  embeds,
  db,
  getThumbnailForItem,
  buildNotifiableData,
  beats,
  i18ns,
  fromNow,
};
