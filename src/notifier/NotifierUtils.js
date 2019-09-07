'use strict';

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

// const dbSettings = {
//   host: process.env.MYSQL_HOST || 'localhost',
//   port: process.env.MYSQL_PORT || 3306,
//   user: process.env.MYSQL_USER || 'genesis',
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DB || 'genesis',
// };

const rest = require('@spectacles/rest')(process.env.TOKEN);

const logger = require('../Logger');

// const Database = require('../settings/Database');
// const db = new Database(dbSettings);

module.exports = {
  rest,
  embeds,
  // db,
  logger,
};
