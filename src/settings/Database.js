'use strict';

const SQL = require('sql-template-strings');
const mysql = require('mysql2/promise');
const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');

const logger = require('../Logger');
const { assetBase } = require('../CommonFunctions');

const props = (obj) => {
  const p = [];
  for (; obj != null; obj = Object.getPrototypeOf(obj)) { // eslint-disable-line no-param-reassign
    const op = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < op.length; i += 1) {
      if (p.indexOf(op[i]) === -1) { p.push(op[i]); }
    }
  }
  return p.filter(thing => !['db', 'constructor', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__',
    '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'valueOf', '__proto__',
    'toLocaleString'].includes(thing));
};

/**
 * Copy functions from class to this class... theoretically
 * @param {Object} queriesClass class instance
 * @returns {undefined} doesn't return anything
 */
const copyChildrenQueries = (queriesClass) => {
  const keys = props(queriesClass);
  keys.forEach((key) => {
    if (key !== 'db') {
      // eslint-disable-next-line no-use-before-define
      Database.prototype[key] = queriesClass[key];
    }
  });
};

// eslint-disable-next-line
const debugQuery = (query) => {
  const { strings, values } = JSON.parse(JSON.stringify(query));
  const tokens = [];
  strings.forEach((str, ind) => {
    tokens.push(JSON.stringify(str));
    if (values[ind]) {
      tokens.push(values[ind]);
    }
  });
  logger.error(tokens.join(''));
};

/**
 * Connection options for the database
 * @typedef {Object} DbConnectionOptions
 * @property {string} [host=localhost] - The hostname of the database
 * @property {number} [port=3306] - The port number to connect to
 * @property {string} user - The user to authenticate as
 * @property {string} password - The password for that user
 * @property {string} database - The database to use
 */

/**
  * Command Context
  * @type {Object} CommandContext
  * @property {string} platform The channel's configured platform
  * @property {string} prefix The channel's configured command prefix
  * @property {string} language Language to localize, if possible
  * @property {boolean} allowCustom Whether or not to allow custom commands in this channel
  * @property {boolean} allowInline Whether or not to allow inline commands in this channel
  * @property {boolean} defaultRoomsLocked Whether or not to set private rooms
  *  created from this channel to locked
  * @property {boolean} defaultNoText Whether or not to create a text chat with private chats
  * @property {boolean} createPrivateChannel Whether or not private chats
  *  are allowed to be created here
  * @property {boolean} defaultShown Whether or not private chats created here are shown by default
  * @property {string} tempCategory Temp category to put private chats in when created.
  *   Makes text chats not be created.
  * @property {boolean} settings.cc.ping Whether or not to ping in custom commands called here
  * @property {boolean} respondToSettings Whether or not to respond to settings changes.
  *  Changes are applied no matter the value.
  * @property {Object} webhook Webhook information for this channel
  * @property {string} webhook.id Webhook id
  * @property {string} webhook.token Webhook token
  * @property {string} webhook.name Webhook name (can be overrided)
  * @property {string} webhook.avatar Webhook avatar (can be overrided)
  * @property {Object} lfg Channel configs per-platform where LFG posts will be put.
  * @property {Discord.Channel} lfg.pc PC lfg channel
  * @property {Discord.Channel} lfg.ps4 PS4 lfg channel
  * @property {Discord.Channel} lfg.swi Switch lfg channel
  * @property {Discord.Channel} lfg.xb1 XB1 lfg channel
  * @property {boolean} isBlacklisted whether or not the user
  *   calling the command is blacklisted from the bot
  * @property {boolean} isOwner whether or not the user
  *   calling the command is blacklisted from the bot
  */

/**
 * Persistent storage for the bot
 */
class Database {
  /**
   * @param {DbConnectionOptions} dbOptions Connection options for the database
   * @param {Genesis} bot Bot to load the settings for
   */
  constructor(dbOptions, bot) {
    this.bot = bot;

    if (bot && bot.client) {
      this.scope = 'bot';
    } else {
      this.scope = 'worker';
    }

    this.defaults = {
      username: this.bot && this.bot.client && this.bot.client.user
        ? this.bot.client.user.username
        : 'Genesis',
      avatar: this.bot && this.bot.client && this.bot.client.user
        ? this.bot.client.user.displayAvatarURL().replace('.webp', '.png')
          .replace('.webm', '.gif').replace('?size=2048', '')
        : `${assetBase}/avatar.png`,
    };

    const opts = {
      supportBigNumbers: true,
      bigNumberStrings: true,
      Promise,
    };
    Object.assign(opts, dbOptions);
    this.db = mysql.createPool(opts);

    this.defaults = {
      prefix: '/',
      respond_to_settings: true,
      platform: 'pc',
      language: 'en',
      delete_after_respond: true,
      delete_response: true,
      createPrivateChannel: false,
      deleteExpired: false,
      allowCustom: false,
      allowInline: false,
      defaultRoomsLocked: true,
      defaultNoText: false,
      defaultShown: false,
      tempCategory: false,
      'settings.cc.ping': true,
    };

    const dbRoot = path.join(__dirname, 'DatabaseQueries');
    fs.readdirSync(dbRoot)
      .filter(f => f.endsWith('.js'))
      .forEach((file) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const QClass = require(path.join(dbRoot, file));
        const qInstance = new QClass(this.db);
        copyChildrenQueries(qInstance);
      });

    this.clusterId = process.env.CLUSTER_ID || 0;
  }

  /**
   * Gets the current count of guilds and channels
   * @returns {Promise}
   */
  async getChannelAndGuildCounts() {
    const query = 'select count(distinct guild_id) as countGuilds, count(distinct id) as countChannels from channels;';
    const res = await this.db.query(query);
    if (res[0]) {
      return {
        channels: res[0].countChannels,
        guilds: res[0].countGuilds,
      };
    }
    return {};
  }

  /**
   * Get context (including settings) for a command in a channel
   * @param {Discord.Channel} channel channel to get settings for
   * @param {Discord.User} user user to check for specific settings for
   * @returns {CommandContext} context
   */
  async getCommandContext(channel, user) {
    this.getChannelSetting(channel, 'prefix'); // ensure it's set at some point
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id}
      and setting in ('platform', 'prefix', 'allowCustom', 'allowInline', 'webhookId',
        'webhookToken', 'webhookName', 'webhookAvatar', 'defaultRoomsLocked',
        'defaultNoText', 'defaultShown', 'createPrivateChannel', 'tempCategory',
        'lfgChannel', 'settings.cc.ping', 'language', 'respond_to_settings',
        'lfgChannel.swi', 'lfgChannel.ps4', 'lfgChannel.xb1', 'delete_after_respond');`;
    const res = await this.db.query(query);
    let context = {
      webhook: {},
    };
    if (res[0]) {
      res[0].map(row => ({
        setting: row.setting,
        value: row.val,
      })).forEach((row) => {
        if (row.setting.indexOf('webhook') === -1) {
          context[`${row.setting}`] = row.value;
        } else {
          context.webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });
      if (!context.platform) {
        context.platform = this.defaults.platform;
        this.setChannelSetting(channel, 'platform', this.defaults.platform);
      }

      if (!context.prefix) {
        context.prefix = this.defaults.prefix;
      }

      if (!context.language) {
        context.language = this.defaults.language.substr(0, 2);
      } else if (context.language.length > 2) {
        this.setChannelSetting(channel, 'language', context.language.substr(0, 2));
        context.language = context.language.substr(0, 2);
      }

      if (typeof context.allowCustom === 'undefined') {
        context.allowCustom = this.defaults.allowCustom;
      } else {
        context.allowCustom = context.allowCustom === '1';
      }
      if (typeof context.allowInline === 'undefined') {
        context.allowInline = this.defaults.allowInline;
      } else {
        context.allowInline = context.allowInline === '1';
      }

      if (typeof context.defaultRoomsLocked === 'undefined') {
        context.defaultRoomsLocked = this.defaults.defaultRoomsLocked;
      } else {
        context.defaultRoomsLocked = context.defaultRoomsLocked === '1';
      }

      if (typeof context.defaultNoText === 'undefined') {
        context.defaultNoText = this.defaults.defaultNoText;
      } else {
        context.defaultNoText = context.defaultNoText === '1';
      }

      if (typeof context.defaultShown === 'undefined') {
        context.defaultShown = this.defaults.defaultShown;
      } else {
        context.defaultShown = context.defaultShown === '1';
      }

      if (typeof context['settings.cc.ping'] === 'undefined') {
        context['settings.cc.ping'] = this.defaults['settings.cc.ping'];
      } else {
        context['settings.cc.ping'] = context['settings.cc.ping'] === '1';
      }

      if (typeof context.createPrivateChannel === 'undefined') {
        context.createPrivateChannel = this.defaults.createPrivateChannel;
      } else {
        context.createPrivateChannel = context.createPrivateChannel === '1';
      }

      if (!(context.webhook.id && context.webhook.token)) {
        context.webhook = undefined;
      }

      if (context.tempCategory && channel.guild.channels.has(context.tempCategory.trim())) {
        context.tempCategory = channel.guild.channels.get(context.tempCategory.trim());
      } else {
        context.tempCategory = undefined;
      }

      if (context.lfgChannel) {
        context.lfg = {};
        context.lfg.pc = channel.guild.channels.get(context.lfgChannel);
        delete context.lfgChannel;
      }

      if (context.delete_after_respond) {
        context.deleteCommand = parseInt(context.delete_after_respond, 10) === 1;
        delete context.delete_after_respond;
      } else {
        context.deleteCommand = this.defaults.delete_after_respond;
      }

      if (context['lfgChannel.ps4']) {
        if (!context.lfg) {
          context.lfg = {};
        }
        context.lfg.ps4 = channel.guild.channels.get(context['lfgChannel.ps4']);
        delete context['lfgChannel.ps4'];
      }
      if (context['lfgChannel.swi']) {
        if (!context.lfg) {
          context.lfg = {};
        }
        context.lfg.swi = channel.guild.channels.get(context['lfgChannel.swi']);
        delete context['lfgChannel.swi'];
      }
      if (context['lfgChannel.xb1']) {
        if (!context.lfg) {
          context.lfg = {};
        }
        context.lfg.xb1 = channel.guild.channels.get(context['lfgChannel.xb1']);
        delete context['lfgChannel.xb1'];
      }

      if (typeof context.respond_to_settings === 'undefined') {
        context.respondToSettings = this.defaults.respond_to_settings;
      } else {
        context.respondToSettings = context.respond_to_settings === '1';
        delete context.respond_to_settings;
      }
    } else {
      context = {
        platform: this.defaults.platform,
        prefix: this.defaults.prefix,
        language: this.defaults.language,
        allowCustom: this.defaults.allowCustom === '1',
        allowInline: this.defaults.allowInline === '1',
        defaultRoomsLocked: this.defaults.defaultRoomsLocked === '1',
        defaultNoText: this.defaults.defaultNoText === '1',
        createPrivateChannel: this.defaults.createPrivateChannel === '1',
        'settings.cc.ping': this.defaults['settings.cc.ping'] === '1',
        respondToSettings: this.defaults.respond_to_settings,
        deleteCommand: this.defaults.delete_after_respond,
      };
    }
    if (user) {
      context.isBlacklisted = await this.isBlacklisted(user.id,
        channel.guild ? channel.guild.id : 0);
      context.isOwner = user.id === this.bot.owner;
    }
    context.channel = channel;
    return context;
  }
}

module.exports = Database;
