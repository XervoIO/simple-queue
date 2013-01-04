var client = require('../lib/simple-queue').Client({ debug: false });

client.subscribe('QueueA', function(err, message) {
  console.log('QueueA Message Received');
  console.log(message);
});

client.subscribe('QueueB', function(err, message) {
  console.log('QueueB Message Received');
  console.log(message);
});

client.subscribe('QueueB', function(err, message) {
  console.log('QueueB Message Received (2)');
  console.log(message);
});

setInterval(function() {
  client.enqueue('QueueA', { something: "someValueA" }, function(err, result) {
    console.log('Error: ' + err);
    console.log(result);
  });
}, 500);