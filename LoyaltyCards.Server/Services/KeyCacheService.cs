using LoyaltyCards.Server.Services;

public class KeyCacheService : IKeyCacheService
{
    private class CachedKey
    {
        public byte[] Key { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    private readonly Dictionary<Guid, CachedKey> _keys = new();
    private readonly TimeSpan _timeout = TimeSpan.FromMinutes(30);

    public void StoreKey(Guid userId, byte[] key)
    {
        _keys[userId] = new CachedKey
        {
            Key = key,
            ExpiresAt = DateTime.UtcNow.Add(_timeout)
        };
    }

    public bool TryGetKey(Guid userId, out byte[] key)
    {
        key = null;

        if (_keys.TryGetValue(userId, out var cachedKey))
        {
            if (DateTime.UtcNow <= cachedKey.ExpiresAt)
            {
                cachedKey.ExpiresAt = DateTime.UtcNow.Add(_timeout);
                key = cachedKey.Key;
                return true;
            }

            _keys.Remove(userId);
        }

        return false;
    }

    public void RemoveKey(Guid userId)
    {
        _keys.Remove(userId);
    }
}
