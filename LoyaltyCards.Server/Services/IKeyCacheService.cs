namespace LoyaltyCards.Server.Services
{
    public interface IKeyCacheService
    {
        void StoreKey(int userId, byte[] key);
        bool TryGetKey(int userId, out byte[]? key);
        void RemoveKey(int userId);
    }
}
