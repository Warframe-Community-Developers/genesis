'use strict';

const ms30d = 2592000000;

/**
 * Convert a time string to the seconds it comprises
 * @param  {string} time Time as a string
 * @returns {number}      Time as a Number
 */
function timeToSeconds(time) {
  if (time === undefined) {
    return 0;
  }
  const a = time.split(':');
  const seconds = (((+a[0]) * 60) * 60) + (((+a[1]) * 60) + (+a[2]));
  return seconds;
}

/**
 * Checks number value and returns 0 if number is NaN
 * @param {?} value Value to check
 * @returns {number|?} Either the passed value or 0
 */
function safeNumber(value) {
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Format time from number to string
 * @param  {number} n time as a number
 * @returns {string}   time as a string
 */
function formatTime(n) {
  const hours = safeNumber(Math.floor(n / 60 / 60));
  const minutes = safeNumber(Math.floor((n - (hours * 60 * 60)) / 60));
  const seconds = safeNumber(Math.round(n - (hours * 60 * 60) - (minutes * 60)));
  const h = hours > 0 ? `${(hours < 10) ? `0${hours}` : hours}:` : '';
  return `${h + ((minutes < 10) ? `0${minutes}` : minutes)}:${(seconds < 10) ? `0${seconds}` : seconds}`;
}

/**
 * Sort numbers
 * @param  {number} a First number
 * @param  {number} b Second number
 * @returns {number}   1 if more, 0 if equal, -1 if less
 */
function sortNumber(a, b) {
  return a - b;
}

/**
 * Get the lowest time of the user's times.
 * @param  {Array<number>} times Array of times for the player
 * @returns {string}       Average time as a string
 */
function getBestTime(times) {
  return formatTime(times.sort(sortNumber)[0]);
}

/**
 * Get the average time for a list of times
 * @param  {Array<number>} times Array of times for the player
 * @returns {string}       Average time as a string
 */
function getAverageTime(times) {
  let sum = 0;
  for (let i = 0; i < times.length; i += 1) {
    sum += parseInt(times[i], 10);
  }
  return formatTime(sum / times.length);
}

class RaidStat {
  constructor(userJson, type) {
    this.successes = 0;
    this.completed = 0;
    this.best = '';
    this.average = '';
    this.successTimes = [];
    this.uniqueMems = [];
    this.thirty_successes = 0;
    this.thirty_completed = 0;
    this.thirty_times = [];
    this.thirty_average = '';

    if (userJson) {
      this.calculateStats(userJson, type);
    }

    this.best = getBestTime(this.successTimes);
    this.average = getAverageTime(this.successTimes);
    this.thirty_average = getAverageTime(this.thirty_times);
  }

  /**
   * Calculate a user's stats from fetched json
   * @param  {Object} json JSON object describing all of a user's raid statistics
   * @param  {string} type type of
   */
  calculateStats(json, type) {
    const now = Date.now();
    json.forEach((raid) => {
      const raidDate = new Date(raid.leaderboardGenerated).getTime();
      const newerThan30Days = now - ms30d < raidDate;
      if (raid.type === type) {
        if (raid.objective === 'VICTORY') {
          this.successes += 1;
          this.successTimes.push(timeToSeconds(raid.time));
          if (newerThan30Days) {
            this.thirty_successes += 1;
            this.thirty_times.push(timeToSeconds(raid.time));
          }
        }
        this.completed += 1;
        if (newerThan30Days) {
          this.thirty_completed += 1;
        }
        raid.players.push(raid.host);
        raid.players.forEach((player) => {
          if (this.uniqueMems.indexOf(player) === -1) {
            this.uniqueMems.push(player);
          }
        });
      }
    });
  }

  toString() {
    return `**Cleared:** ${this.successes}/${this.completed}\n`
    + `**Best Time:** ${this.best}\n`
    + `**Average Time:** ${this.average}\n`
    + `**Unique Party Members:** ${this.uniqueMems.length}\n`
    + `**Cleared (30d):** ${this.thirty_successes}/${this.thirty_completed}\n`
    + `**Average Time (30d):** ${this.thirty_average}`;
  }

  makeTotals(lor, lornm, jv) {
    this.successes = lor.successes + lornm.successes + jv.successes;
    this.completed = lor.completed + lornm.completed + jv.completed;
    this.best = getBestTime([timeToSeconds(lor.best),
      timeToSeconds(lornm.best), timeToSeconds(jv.best)]);
    this.average = getAverageTime([timeToSeconds(lor.average),
      timeToSeconds(lornm.average), timeToSeconds(jv.average)]);
    this.successTimes = [].concat(lor.successTimes)
      .concat(lornm.successTimes).concat(jv.successTimes);
    this.uniqueMems = [];
    lor.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });
    lornm.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });
    jv.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });

    this.thirty_successes = lor.thirty_successes + lornm.thirty_successes + jv.thirty_successes;
    this.thirty_completed = lor.thirty_completed + lornm.thirty_completed + jv.thirty_completed;
    this.thirty_times = [].concat(lor.thirty_times)
      .concat(lornm.thirty_times).concat(jv.thirty_times);

    this.best = getBestTime(this.successTimes);
    this.average = getAverageTime(this.successTimes);
    this.thirty_average = getAverageTime(this.thirty_times);
  }
}

module.exports = RaidStat;
