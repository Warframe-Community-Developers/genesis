'use strict';

const { GiveawaysManager } = require('discord-giveaways');

const Handler = require('../models/BaseEventHandler');

const DynamicVoiceHandler = require('./DynamicVoiceHandler');
const FeedsNotifier = require('../notifications/FeedsNotifier');
const TwitchNotifier = require('../notifications/TwitchNotifier');
const MessageManager = require('../settings/MessageManager');

const { timeDeltaToMinutesString, fromNow, games } = require('../CommonFunctions');

const max = {
  cetus: {
    day: 6000000,
    night: 3000000,
  },
  vallis: {
    warm: 400000,
    cold: 1600000 - 400000,
  },
};

const cycleTimeout = 60000;

/**
 * Describes a handler
 */
class OnReadyHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.onReady', 'ready');
  }

  /**
   * Run the ready handle
   */
  async execute() {
    this.logger.silly(`Running ${this.id} for ${this.event}`);
    this.logger.info('[Cluster] READY');

    this.notifyUp();
    this.setupMessageManager();

    await this.settings.ensureData(this.client);
    this.bot.readyToExecute = true;

    this.updatePresence();
    this.setupAdditionalHandlers();
    this.setupNotifiers();
    this.setupGiveaways();
  }

  async notifyUp() {
    if (this.bot.controlHook && ((process.env.LOG_LEVEL || 'ERROR').toLowerCase() === 'debug')) {
      await this.bot.controlHook.edit(
        this.bot.client.user.username,
        this.bot.client.user.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
      );
      this.bot.controlHook.send({
        embeds: [{
          description: `Shards **${this.bot.shards[0] + 1} - ${this.bot.shards[this.bot.shards.length - 1] + 1}** ready`,
          color: 0x2B90EC,
        }],
      });
    }
  }

  setupMessageManager() {
    this.bot.MessageManager = new MessageManager(this.bot);
  }

  setupAdditionalHandlers() {
    setInterval(this.updatePresence.bind(this), cycleTimeout);
    setInterval(this.checkPrivateRooms.bind(this), cycleTimeout);
    this.bot.dynamicVoiceHandler = new DynamicVoiceHandler(this.client, this.logger, this.settings);
  }

  setupNotifiers() {
    this.bot.feedNotifier = new FeedsNotifier(this.bot);
    this.bot.twitchNotifier = new TwitchNotifier(this.bot);
    this.bot.twitchNotifier.start();
  }

  setupGiveaways() {
    if (!games.includes('GIVEAWAYS')) {
      this.logger.silly('No init: giveaways. Feature flag disabled.');
      return;
    }
    this.bot.giveaways = new GiveawaysManager(this.bot.client, {
      updateCountdownEvery: 5000,
      storage: './giveaways.json',
      default: {
        botsCanWin: false,
        embedColor: '#748BD7',
        embedColorEnd: '#FF0000',
        reaction: '🎉',
      },
    });
    this.logger.info('Giveaways initialized!');
  }

  async getWarframePresence(base) {
    const cetusState = await this.bot.ws.get('cetusCycle');
    const vallisState = await this.bot.ws.get('vallisCycle');

    if (vallisState || cetusState) {
      let vsFromNow = fromNow(new Date(vallisState.expiry));
      let csFromNow = fromNow(new Date(cetusState.expiry));

      if (vsFromNow < 0) {
        vsFromNow = (vallisState.isWarm ? max.vallis.cold : max.vallis.warm) + vsFromNow;
        vallisState.isWarm = !vallisState.isWarm;
      }

      if (csFromNow < 0) {
        csFromNow = (cetusState.isDay ? max.cetus.night : max.cetus.day) + csFromNow;
        cetusState.isDay = !cetusState.isDay;
      }

      const vs = vallisState ? `${timeDeltaToMinutesString(vsFromNow) || '0m'}: ${vallisState.isWarm ? '❄' : '🔥'} • ` : '';
      const cs = cetusState ? `${timeDeltaToMinutesString(csFromNow) || '0m'}: ${cetusState.isDay ? '🌙' : '☀'} • ` : '';

      return `${vs}${cs}${base}`;
    }
    return base;
  }

  /**
   * Set up presence when the bot is ready.
   * Can flex based on various games.
   */
  async updatePresence() {
    try {
      const baseMsg = process.env.BASE_PRES_MSG || `@${this.client.user.username} help`;
      const activity = process.env.BASE_PRES_ACT || 'PLAYING';

      const wfPresence = games.includes('WARFRAME') ? await this.getWarframePresence(baseMsg) : null;
      const presence = wfPresence || baseMsg;
      this.client.user.setPresence({
        status: 'online',
        afk: false,
        activity: {
          name: presence,
          type: activity,
        },
      });
    } catch (error) {
      this.logger.silly(error);
    }
  }

  /**
   * Check if private rooms have expired and are empty. If not, do nothing.
   * If so, delete the corresponding channels.
   */
  async checkPrivateRooms() {
    if (!games.includes('UTIL')) return;
    this.logger.silly('Checking private rooms...');
    const privateRooms = await this.settings.getPrivateRooms();
    this.logger.silly(`Private rooms... ${privateRooms.length}`);
    privateRooms.forEach(async (room) => {
      if (room && (room.textChannel || room.category || room.voiceChannel)) {
        const now = new Date();
        if (((now.getTime() + (now.getTimezoneOffset() * 60000)) - room.createdAt
            > this.channelTimeout)
          && (!room.voiceChannel || room.voiceChannel.members.size === 0)) {
          if (room.textChannel && room.textChannel.deletable) {
            this.logger.silly(`Deleting text channel... ${room.textChannel.id}`);
            await room.textChannel.delete();
          }
          if (room.voiceChannel && room.voiceChannel.deletable) {
            this.logger.silly(`Deleting voice channel... ${room.voiceChannel.id}`);
            await room.voiceChannel.delete();
          }
          if (room.category && room.category.deletable) {
            this.logger.silly(`Deleting category... ${room.category.id}`);
            await room.category.delete();
          }
          this.settings.deletePrivateRoom(room);
        }
      } else if (room) {
        await this.settings.deletePrivateRoom({
          textChannel: room.textId ? { id: room.textId } : undefined,
          voiceChannel: { id: room.voiceId },
          category: { id: room.categoryId },
          guild: { id: room.guildId },
        });
      }
    });
  }
}

module.exports = OnReadyHandle;
