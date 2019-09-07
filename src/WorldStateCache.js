'use strict';

const EventEmitter = require('events');
const { apiBase } = require('./CommonFunctions');
const fetch = require('./tools/Fetcher');

const worldStateURLs = {
  pc: `${apiBase}/pc`,
  ps4: `${apiBase}/ps4`,
  xb1: `${apiBase}/xb1`,
  swi: `${apiBase}/swi`,
};

class WorldStateCache extends EventEmitter {
  constructor(platform, timeout, logger = console) {
    super();
    this.url = worldStateURLs[platform];
    this.timeout = timeout;
    this.currentData = null;
    this.lastUpdated = null;
    this.updating = null;
    this.platform = platform;
    this.updateInterval = setInterval(() => this.update(), timeout);
    this.logger = logger;
    this.update();
  }

  async getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }

  async update() {
    try {
      this.lastUpdated = Date.now();
      this.currentData = await fetch(this.url);
      this.updating = undefined;
      this.emit('newData', this.platform, this.currentData);
      return this.currentData;
    } catch (err) {
      this.updating = undefined;
      this.logger.error(err);
    }
    return this.updating;
  }
}

module.exports = WorldStateCache;
