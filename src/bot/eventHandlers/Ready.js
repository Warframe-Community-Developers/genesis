'use strict';

const Handler = require('../../models/BaseEventHandler');

const DynamicVoiceHandler = require('./DynamicVoiceHandler');
// const FeedsNotifier = require('../notifications/FeedsNotifier');
const MessageManager = require('../../settings/MessageManager');

const { timeDeltaToMinutesString, fromNow } = require('../../CommonFunctions');

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

/**
 * Check if private rooms have expired and are empty. If not, do nothing.
 * If so, delete the corresponding channels.
 * @param  {Genesis} self    Bot instance
 */
async function checkPrivateRooms(self) {
  self.logger.debug('Checking private rooms...');
  const privateRooms = await self.settings.getPrivateRooms();
  self.logger.debug(`Private rooms... ${privateRooms.length}`);
  privateRooms.forEach(async (room) => {
    if (room && (room.textChannel || room.category || room.voiceChannel)) {
      const now = new Date();
      if (((now.getTime() + (now.getTimezoneOffset() * 60000)) - room.createdAt
          > self.channelTimeout)
        && (!room.voiceChannel || room.voiceChannel.members.size === 0)) {
        if (room.textChannel && room.textChannel.deletable) {
          self.logger.debug(`Deleting text channel... ${room.textChannel.id}`);
          await room.textChannel.delete();
        }
        if (room.voiceChannel && room.voiceChannel.deletable) {
          self.logger.debug(`Deleting voice channel... ${room.voiceChannel.id}`);
          await room.voiceChannel.delete();
        }
        if (room.category && room.category.deletable) {
          self.logger.debug(`Deleting category... ${room.category.id}`);
          await room.category.delete();
        }
        self.settings.deletePrivateRoom(room);
      }
    } else if (room) {
      await self.settings.deletePrivateRoom({
        textChannel: room.textId ? { id: room.textId } : undefined,
        voiceChannel: { id: room.voiceId },
        category: { id: room.categoryId },
        guild: { id: room.guildId },
      });
    }
  });
}

/**
 * Perform actions when the bot is ready
 * @param {Bot} self  the bot
 */
async function updatePresence(self) {
  try {
    const cetusState = await self.bot.ws.get('cetusCycle');
    const vallisState = await self.bot.ws.get('vallisCycle');
    const base = `@${self.client.user.username} help`;
    let final = base;
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

      const vs = vallisState ? `${timeDeltaToMinutesString(vsFromNow) || '0m'} to ${vallisState.isWarm ? '❄' : '🔥'} | ` : '';
      const cs = cetusState ? `${timeDeltaToMinutesString(csFromNow) || '0m'} to  ${cetusState.isDay ? '🌙' : '☀'} | ` : '';
      final = `${vs}${cs}${base}`;
    }

    if (cetusState) {
      self.client.user.setPresence({
        status: 'online',
        afk: false,
        activity: {
          name: final,
          type: 'WATCHING',
        },
      });
    }
  } catch (error) {
    // swallow, it's not an important error
  }
}

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
    super(bot, 'handlers.onReady', 'onReady');
    this.channelTimeout = 60000;
  }

  /**
   * Run the ready handle
   */
  async execute() {
    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.info('[Cluster] READY');

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
    this.bot.MessageManager = new MessageManager(this.bot);
    await this.settings.ensureData(this.client);
    this.bot.readyToExecute = true;

    const self = this;
    setInterval(checkPrivateRooms, self.channelTimeout, self);
    updatePresence(this);
    setInterval(updatePresence, 60000, self);
    this.bot.dynamicVoiceHandler = new DynamicVoiceHandler(this.client, this.logger, this.settings);
    // this.bot.feedNotifier = new FeedsNotifier(this.bot);
  }
}

module.exports = OnReadyHandle;
