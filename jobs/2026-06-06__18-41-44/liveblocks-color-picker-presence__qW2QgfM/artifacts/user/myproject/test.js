const { createClient } = require('@liveblocks/client');
try {
  createClient({
    publicApiKey: 'pk_test_123',
    authEndpoint: '/api/liveblocks-auth'
  });
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
