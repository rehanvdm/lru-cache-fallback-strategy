
export class Redis
{
  constructor() {
    this.connected = false;
    this.storage = { }; /* Hashmap used for lookups */
    this.redisDownError = new Error("Can not connect to redis");
    this.lastConnectionAttemp = null;
  }

  async connect(){
    /* Lazy loaded connection */
    if(this.connected === true)
      return;

    /* Basic circuit breaker, to only check if connection is open every 10 seconds after it went down */
    if(this.lastConnectionAttemp && (Date.now() - this.lastConnectionAttemp) < 10_000)
    {
      let retryIn = 10 - Math.round((Date.now() - this.lastConnectionAttemp)/1000);
      process.env.APP_LOG && console.log("[Redis] Down.. Will retry connection in "+retryIn+" seconds");
      throw this.redisDownError;
    }

    let tries = 1;
    do
    {
      await new Promise(resolve => setTimeout(resolve, parseInt(process.env.REDIS_CONNECT_TIMEOUT)));
      this.connected = process.env.REDIS_UP === "true";
      process.env.APP_LOG && console.log("[Redis] Connecting..");
    } while (tries++ < 3 && this.connected === false);

    if(!this.connected)
    {
      this.lastConnectionAttemp = Date.now();
      throw this.redisDownError;
    }
    this.lastConnectionAttemp = null;
  }

  async set(key, data) {
    await this.connect();

    await new Promise(resolve => setTimeout(resolve, parseInt(process.env.REDIS_COMMAND_TIME)));

    /* The outside force says redis is down */
    if(process.env.REDIS_UP === "false") {
      this.connected = false;
      process.env.APP_LOG && console.log("[Redis] Command failed, Redis Down..");
      throw this.redisDownError;
    }

    process.env.REDIS_SET = process.env.REDIS_SET ? (parseInt(process.env.REDIS_SET)+1) : 1;
    this.storage[key] = JSON.stringify(data);
  }

  /**
   * Returns data or undefined if not found
   * @param key
   * @return {Promise<*>}
   */
  async get(key) {
    await this.connect();

    await new Promise(resolve => setTimeout(resolve, parseInt(process.env.REDIS_COMMAND_TIME)));

    /* The outside force says redis is down */
    if(process.env.REDIS_UP === "false") {
      this.connected = false;
      process.env.APP_LOG && console.log("[Redis] Command failed, Redis Down..");
      throw this.redisDownError;
    }

    process.env.REDIS_GET = process.env.REDIS_GET ? (parseInt(process.env.REDIS_GET)+1) : 1;
    return this.storage[key] ? JSON.parse(this.storage[key]) : undefined;
  }
}


