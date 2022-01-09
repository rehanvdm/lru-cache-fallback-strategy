import LRU from "lru-cache";

export class LRUCache
{
  /**
   *
   * @param memSize in MB
   */
  constructor(memSize)
  {
    this.lru = new LRU({
      max: memSize*1000_000,
      /* The value stored always has a .length(), it is stored and retrieved as strings with the JSON.x methods.
      *  There lru-cache uses a linked list library called `yallist` which represents a node as a function, with
      *  "function pointers" and value in each function/object. Neither yallist nor lru-cache has any concrete
      *  documentation that translates data storage size to memory size, lru-cache stores data in a JS Map as
      *  well as the linked list to track the most recent items, there for we can say the storage size of a single item
      *  is at least more than 2*item size + key size. To account for many unknowns and overheads, and to err on the side
      *  of caution we are using 4*items size + key size */
      length: (val, key) => (val.toString().length * 4) + key.toString().length
    });
  }

  async set(key, data)
  {
    process.env.LRU_SET = process.env.LRU_SET ? (parseInt(process.env.LRU_SET) + 1) : 1;
    this.lru.set(key, JSON.stringify(data));
  }

  /**
   * Returns data or undefined if not found
   * @param key
   * @return {Promise<*>}
   */
  async get(key)
  {
    process.env.LRU_GET = process.env.LRU_GET ? (parseInt(process.env.LRU_GET) + 1) : 1;
    return this.lru.get(key) ? JSON.parse(this.lru.get(key)) : undefined;
  }
}


