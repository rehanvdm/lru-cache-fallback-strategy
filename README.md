#  LRU cache fallback strategy

This is the code base for a blog post: https://www.rehanvdm.com/blog/lru-cache-fallback-strategy

## Intro:

A Least Recently Used(LRU) cache stores items in-memory and evicts the oldest(less used) ones as soon as the allocated memory (or item count) has been reached. Storing data in-memory before reaching for an external cache increases speed and decrease the dependency on the external cache. It is also possible to fallback to in-memory caches like an LRU cache in periods that your external cache goes down without seeing a significant impact on performance.

> Conclusion (TL;DR) By leveraging an in-memory cache you reduce pressure on the downstream caches, reduce costs and speed up systems. Consider having an in-memory first policy, instead of having an in-memory fallback cache strategy to see the biggest gains.

Read more here: https://www.rehanvdm.com/blog/lru-cache-fallback-strategy
