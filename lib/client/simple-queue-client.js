var request = require('request'),
    util = require('util');

//--------------------------------------------------------------------------------------------------
var ClientFactory = function(options) {
  return new Client(options);
};

//--------------------------------------------------------------------------------------------------
var Client = function(options) {
  this.options = getOptions(options);
  this.subscriptions = {};
};

/**
 * Subscribes to messages for the specified queue.
 * @param queue The name of the queue to subscribe to.
 * @param callback Invoked when a new message is available.
 */
//--------------------------------------------------------------------------------------------------
Client.prototype.subscribe = function(queue, callback) {

  this.debugLog('Subscribing to messages from queue: ' + queue);

  // Already subscribed, just add the callback to be invoked.
  if(this.subscriptions[queue]) {
    this.subscriptions[queue].callbacks.push(callback);
    return;
  }

  var subscription = {
    queue: queue,
    enabled: true,
    callbacks: [callback]
  };

  this.watchQueue(subscription, this.options);

  this.subscriptions[queue] = subscription;
};

/**
 * Begins polling the queue server for new messages.
 * @param subscription
 */
//--------------------------------------------------------------------------------------------------
Client.prototype.watchQueue = function(subscription) {

  var self = this;

  var url = util.format('http://%s%s:%s/dequeue/%s',
    this.options.username ? (this.options.username + ':' + this.options.password + '@') : '',
    this.options.host,
    this.options.port,
    subscription.queue);

  var poll = function() {

    self.debugLog('Checking queue for message: ' + subscription.queue);
    self.debugLog('URL: ' + url);

    request({
      url: url,
      method: 'GET'
    }, function(err, response, body) {

      if(err) {
        self.debugLog('An error occurred while request queue message: ' + err);
      }
      // There is no message.
      else if(response.statusCode === 204) {
        self.debugLog('No message available for queue: ' + subscription.queue);
      }
      // A message is available.
      else if(response.statusCode === 200) {
        var message = body;
        try {
          message = JSON.parse(body);
        }
        catch(e) {
          self.debugLog('Failed to JSON-parse incoming message.')
        }

        // Invoke all callbacks.
        // The subscription may have been cancelled while we were waiting on this request to
        // complete.
        if(subscription.enabled) {
          subscription.callbacks.forEach(function(callback) {
            callback(null, message);
          });
        }
      }
      else {
        self.debugLog('An unexpected status code has been returned: ' + response.statusCode);
      }

      // If the subscription is still enabled, keep polling.
      if(subscription.enabled) {
        setTimeout(poll, self.options.poll_speed);
      }
    });
  };

  poll();
};

/**
 * Unsubscribes from the specified queue.
 * @param queue The name of the queue to unsubscribe from.
 */
//--------------------------------------------------------------------------------------------------
Client.prototype.unsubscribe = function(queue) {
  if(this.subscriptions[queue]) {
    this.subscriptions[queue].enabled = false;
    this.subscriptions[queue] = null;
  }
};

/**
 * Puts a message into a queue.
 * @param queue The queue to send a message to.
 * @param message The object to queue.
 * @param callback Invoked when complete.
 */
//--------------------------------------------------------------------------------------------------
Client.prototype.enqueue = function(queue, message, callback) {

  var self = this;
  var success = false;
  var tryCount = 0;

  if(!callback) {
    callback = function() { };
  }

  var url = util.format('http://%s%s:%s/enqueue/%s',
    this.options.username ? (this.options.username + ':' + this.options.password + '@') : '',
    this.options.host,
    this.options.port,
    queue);

  var enqueue = function() {

    tryCount++;

    self.debugLog('Enqueuing message: ' + queue);
    self.debugLog('URL: ' + url);

    // We've tried all we're going to try. Time to bail.
    if(tryCount > self.options.enqueue_retry_limit) {
      return callback(new Error('Failed to enqueue message after ' + self.options.enqueue_retry_limit + ' attempts.'));
    }

    request({
      url: url,
      method: 'POST'
    }, function(err, response, body) {

      if(err) {
        self.debugLog('Failed to queue message: ' + err);
      }
      else if(response.statusCode === 200) {
        self.debugLog('Successfully queued message.');
        success = true;
        callback(null, JSON.parse(body));
      }
      else {
        self.debugLog('Unexpected status code: ' + response.statusCode);
      }

      // If it failed, attempt to queue it again.
      if(!success) {
        setTimeout(enqueue, self.options.enqueue_retry_delay);
      }
    });
  };

  enqueue();
};

/**
 * Logs a message to the console if the debug option is enabled.
 * @param message The message or object to log.
 */
//--------------------------------------------------------------------------------------------------
Client.prototype.debugLog = function(message) {
  if(message && this.options.debug) {
    console.log(message);
  }
}

/**
 * Builds up the options object. Supplies default options when none are specified.
 * @param options Options object.
 */
//--------------------------------------------------------------------------------------------------
var getOptions = function(options) {
  for(var key in defaultOptions) {
    if(!options[key]) {
      options[key] = defaultOptions[key];
    }
  }

  return options;
};

/**
 * The default options.
 */
//--------------------------------------------------------------------------------------------------
var defaultOptions = {
  host: 'localhost',
  port: 8989,
  username: 'guest',
  password: 'guest',
  debug: false,
  poll_speed: 1000,
  enqueue_retry_limit: 300,
  enqueue_retry_delay: 1000
};

module.exports = ClientFactory;