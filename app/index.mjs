import {Redis} from "./redis.mjs";
import * as db from "./db.mjs";
import {LRUCache} from "./lru.js"
/**
 * Some function that identifies the user, probably from the event JWT.
 * Control the distribution and indirectly the cache hit ratio using process.env.USER_POOL_SIZE
 * @return {Promise<{userId}>}
 */
function getUserId() {
  return Math.round(Math.random()*parseInt(process.env.USER_POOL_SIZE-1));
}

const redis = new Redis();
const lru = new LRUCache(10); //10MB

export default async function handler()
{
  let userId = getUserId();
  let user = await redis.get(userId)
                        .catch(err => {
                          if(process.env.FALLBACK_LRU === "false")
                            return undefined;

                          if(err === redis.redisDownError)
                            return lru.get(userId);

                          throw err;
                        });

  if(!user)
  {
    user = await db.getUser(userId);
    await redis.set(userId, user)
               .catch(err => {
                 if(process.env.FALLBACK_LRU === "false")
                   return;

                  if(err === redis.redisDownError)
                    return lru.set(userId, user);

                  throw err;
                });
  }

  process.env.APP_LOG && console.log("User => ", user);
}
