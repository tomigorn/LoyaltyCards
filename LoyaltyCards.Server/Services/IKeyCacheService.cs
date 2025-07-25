namespace LoyaltyCards.Server.Services
{
    public interface IKeyCacheService
    {
        void StoreKey(Guid userId, byte[] key);
        bool TryGetKey(Guid userId, out byte[] key);
        void RemoveKey(Guid userId);
    }
}
