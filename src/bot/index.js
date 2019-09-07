'use strict';

const { Client, WebhookClient } = require('discord.js');

const WorldStateCache = require('../WorldStateCache');
const WorldStateClient = require('../tools/WorldStateClient');
const CommandManager = require('./CommandManager');
const EventHandler = require('./EventHandler');
// const Tracker = require('./Tracker');

const MessageManager = require('../settings/MessageManager');
// const Notifier = require('./notifications/Notifier');
const Database = require('../settings/Database');
const logger = require('../Logger');

const unlog = ['WS_CONNECTION_TIMEOUT'];

/**
 * A collection of strings that are used by the parser to produce markdown-formatted text
 * @typedef {Object.<string>} MarkdownSettings
 * @property {string} lineEnd      - Line return character
 * @property {string} blockEnd     - Block end string
 * @property {string} doubleReturn - Double line return string
 * @property {string} linkBegin    - Link begin string
 * @property {string} linkMid      - Link middle string
 * @property {string} linkEnd      - Link end string
 * @property {string} bold         - String for denoting bold text
 * @property {string} italic       - String for denoting italicized text
 * @property {string} underline    - String for denoting underlined text
 * @property {string} strike       - String for denoting striked-through text
 * @property {string} codeLine     - String for denoting in-line code
 * @property {string} codeBlock    - String for denoting multi-line code blocks
 */

/**
 * Class describing Genesis bot
 */
class Genesis {
  /**
   * @param  {string}           discordToken         The token used to authenticate with Discord
   * @param  {Logger}           logger               The logger object
   * @param  {Object}           [options]            Bot options
   * @param  {string}           [options.prefix]     Prefix for calling the bot
   * @param  {MarkdownSettings} [options.mdConfig]   The markdown settings
   * @param  {number[]}         [options.shards]     Ids of shards to control
   * @param  {Object}           [options.commandManifest] Manifest of commands
   */
  constructor(discordToken, {
    prefix = process.env.PREFIX,
    owner = null,
    commandManifest = null,
    shards = [0],
  } = {}) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Client({
      fetchAllMembers: false,
      ws: {
        compress: true,
      },
      shards,
      totalShardCount: process.env.SHARDS || 1,
      retryLimit: 2,
      disabledEvents: [
        'VOICE_SERVER_UPDATE',
        'PRESENSE_UPDATE',
        'USER_SETTINGS_UPDATE',
        'GUILD_INTEGRATIONS_UPDATE',
        'GUILD_EMOJIS_UPDATE',
        'GUILD_UPDATE',
        'CHANNEL_PINS_UPDATE',
      ],
      restSweepInterval: 20,
      messageSweepInterval: 3600,
      messageCacheLifetime: 3600,
      presence: {
        status: 'dnd',
        afk: false,
        activity: {
          name: 'Starting...',
        },
      },
    });

    /**
     * Discord login token for is bot
     * @type {string}
     * @private
     */
    this.token = discordToken;

    /**
     * The logger object
     * @type {Logger}
     * @private
     */
    this.logger = logger;

    /**
     * Prefix for calling the bot, for use with matching strings.
     * @type {string}
     * @private
     */
    this.escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    /**
     * Prefix for calling the bot, for use with messages.
     * @type {string}
     * @private
     */
    this.prefix = prefix;

    /**
     * Whether or not the bot is ready to execute.
     * This allows stopping commands before servers and users are ready.
     * @type {boolean}
     */
    this.readyToExecute = false;

    /**
     * The bot's owner
     * @type {string}
     */
    this.owner = owner;

    /**
     * Persistent storage for settings
     * @type {Database}
     */
    this.settings = new Database({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'genesis',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB || 'genesis',
    }, this);

    /**
     * Objects holding worldState data, one for each platform
     * @type {Object.<WorldStateCache>}
     */
    this.worldStates = {};

    const worldStateTimeout = process.env.WORLDSTATE_TIMEOUT || 60000;
    ['pc', 'ps4', 'xb1', 'swi']
      .forEach((platform) => {
        this.worldStates[platform] = new WorldStateCache(platform, worldStateTimeout, this.logger);
      });

    this.ws = new WorldStateClient(this.logger);
    this.messageManager = new MessageManager(this);

    /**
     * Command handler for this Bot
     * @type {CommandManager}
     * @private
     */
    this.commandManager = new CommandManager(this, commandManifest.map((cmd) => {
      // eslint-disable-next-line no-param-reassign
      cmd.regex = new RegExp(cmd.regex.body, cmd.regex.flags);
      return cmd;
    }));

    /**
     * Handles events, such as member joins, bans, delets, etc.
     * @type {EventHandler}
     */
    this.eventHandler = new EventHandler(this);
    this.shards = shards;
    this.shardTotal = process.env.SHARDS || 1;
    this.clusterId = process.env.CLUSTER_ID || 0;
    // this.notifier = new Notifier(this);
    // this.tracker = new Tracker(this);

    if (process.env.CONTROL_WH_ID) {
      this.controlHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
    }
  }

  async setupHandlers() {
    this.client.on('ready', async () => this.eventHandler.handleEvent({ event: 'onReady', args: [] }));
    this.client.on('message', async message => this.eventHandler.handleEvent({ event: 'message', args: [message] }));

    this.client.on('guildCreate', async guild => this.eventHandler.handleEvent({ event: 'guildCreate', args: [guild] }));
    this.client.on('guildDelete', async guild => this.eventHandler.handleEvent({ event: 'guildDelete', args: [guild] }));
    this.client.on('channelCreate', async channel => this.eventHandler.handleEvent({ event: 'channelCreate', args: [channel] }));
    this.client.on('channelDelete', async channel => this.eventHandler.handleEvent({ event: 'channelDelete', args: [channel] }));

    this.client.on('messageDelete', async message => this.eventHandler.handleEvent({ event: 'messageDelete', args: [message] }));
    this.client.on('messageDeleteBulk', async messages => this.eventHandler.handleEvent({ event: 'messageDeleteBulk', args: [messages] }));

    this.client.on('guildMemberAdd', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberAdd', args: [guildMember] }));
    this.client.on('guildMemberRemove', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberRemove', args: [guildMember] }));
    this.client.on('guildBanAdd', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanAdd', args: [guild, user] }));
    this.client.on('guildBanRemove', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanRemove', args: [guild, user] }));

    this.client.on('disconnect', (event) => { this.logger.fatal(`Disconnected with close event: ${event.code}`); });
    this.client.on('error', this.logger.error);
    this.client.on('warn', this.logger.warn);
    this.client.on('debug', this.logger.debug);
  }

  /**
   * Creates the database schema and logs in the bot to Discord
   */
  async start() {
    await this.settings.createSchema(this.client);
    this.logger.debug('Schema created');
    await this.commandManager.loadCustomCommands();
    await this.eventHandler.loadHandles();

    this.setupHandlers();
    try {
      await this.client.login(this.token);
      this.logger.debug('Logged in with token.');
      // await this.notifier.start();
    } catch (err) {
      const type = ((err && err.toString()) || '').replace(/Error \[(.*)\]: .*/ig, '$1');
      if (!unlog.includes(type)) {
        this.logger.error(err);
      }
      this.logger.fatal(err);
      process.exit(1);
    }
  }
}

module.exports = Genesis;
