'use strict';

const fs = require('fs');
const path = require('path');
const decache = require('decache');
const BaseEventHandler = require('./models/BaseEventHandler');

/**
 * Describes a CommandHandler for a bot.
 */
class EventHandler {
  /**
   * Constructs CommandHandler
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;

    this.client = bot.client;

    /**
     * Array of command objects that can be called
     * @type {Array<BaseEventHandler>}
     * @private
     */
    this.handlers = [];
  }

  /**
   * Loads the handles from disk into this.handles
   */
  async loadHandles() {
    const handlersDir = path.join(__dirname, 'eventHandlers');
    let files = fs.readdirSync(handlersDir);

    const categories = files.filter(f => f.indexOf('.js') === -1);
    files = files.filter(f => f.indexOf('.js') > -1);

    categories.forEach((category) => {
      files = files.concat(fs.readdirSync(path.join(handlersDir, category))
        .map(f => path.join(category, f)));
    });

    if (this.handlers.length !== 0) {
      this.logger.silly('Decaching handles');
      files.forEach((f) => {
        decache(path.join(handlersDir, f));
      });
    }

    this.logger.info('Loading handles');
    this.logger.silly(`${files}`);

    this.handlers = files.map((f) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Handler = require(path.join(handlersDir, f));
        if (Handler.prototype instanceof BaseEventHandler) {
          const handler = new Handler(this.bot);

          this.logger.silly(`Adding ${handler.id}`);
          return handler;
        }
        return null;
      } catch (err) {
        this.logger.error(err);
        return null;
      }
    })
      .filter(c => c && c !== null);

    this.statuses = this.bot.messageManager.statuses;
  }

  /**
   * Handle the command contained in the message contents, if any.
   * @param {Object} args arguments for handlers
   * @returns {Promise} resolution of handlers execution
   */
  async handleEvent(args) {
    return Promise.all(this.handlers
      .filter(handler => handler.event === args.event)
      .map(async handler => handler.execute(...args.args)));
  }
}

module.exports = EventHandler;
