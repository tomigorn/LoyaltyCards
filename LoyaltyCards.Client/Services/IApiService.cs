namespace LoyaltyCards.Client.Services
{
    public interface IApiService
    {
        Task<T?> PostAsync<T>(string uri, object data);
        Task<bool> PostAsync(string uri, object data);
        Task<T?> GetAsync<T>(string uri);
    }
}
