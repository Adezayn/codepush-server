const Redis = require("ioredis");

const redis = new Redis({
  port: 10000,
  host: "codepush.eastasia.redis.azure.net",
  username: "$default", // Azure Redis always uses this
  password: "<your-access-key>", // get this from Azure portal > Access Keys
  tls: {}, // this enables SSL (mandatory)
});


redis.ping()
  .then(result => {
    console.log("Ping response:", result);  // Should print "PONG"
    return redis.quit();
  })
  .catch(err => {
    console.error("Redis connection error:", err);
  });
