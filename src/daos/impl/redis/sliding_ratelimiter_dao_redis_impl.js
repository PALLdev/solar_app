const redis = require("./redis_client");
/* eslint-disable no-unused-vars */
const keyGenerator = require("./redis_key_generator");
const timeUtils = require("../../../utils/time_utils");
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();

  // START Challenge #7

  const key = keyGenerator.getKey(
    `limiter:${opts.interval}:${name}:${opts.maxHits}`
  );

  const transaction = client.multi();

  transaction.zadd(
    key,
    timeUtils.getCurrentTimestampMillis(),
    `${timeUtils.getCurrentTimestamp()}:${Math.floor(Math.random() * 999) + 1}`
  );

  transaction.zremrangebyscore(
    key,
    0,
    timeUtils.getCurrentTimestampMillis() - opts.interval
  );

  transaction.zcard(key);

  const response = await transaction.execAsync();

  let hitsRemaining;

  // response[2] = hits al recurso
  if (response[2] > opts.maxHits) {
    // Too many hits.
    hitsRemaining = -1;
  } else {
    // Return number of hits remaining.
    hitsRemaining = opts.maxHits - response[2];
  }

  return hitsRemaining;
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
