using Microsoft.Extensions.Caching.Memory;
using System;

namespace LoyaltyCards.Server.Services
{
    public class KeyCacheService : IKeyCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(15);

        public KeyCacheService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public void StoreKey(int userId, byte[] key)
        {
            _cache.Set(userId, key, _cacheDuration);
        }

        public bool TryGetKey(int userId, out byte[]? key)
        {
            return _cache.TryGetValue(userId, out key);
        }

        public void RemoveKey(int userId)
        {
            _cache.Remove(userId);
        }
    }
}
