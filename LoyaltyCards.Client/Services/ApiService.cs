using System.Net.Http.Json;

namespace LoyaltyCards.Client.Services
{
    public class ApiService : IApiService
    {
        private readonly HttpClient _http;

        public ApiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<T?> PostAsync<T>(string uri, object data)
        {
            var response = await _http.PostAsJsonAsync(uri, data);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<T>();
            }

            return default;
        }

        public async Task<bool> PostAsync(string uri, object data)
        {
            var response = await _http.PostAsJsonAsync(uri, data);
            return response.IsSuccessStatusCode;
        }

        public async Task<T?> GetAsync<T>(string uri)
        {
            return await _http.GetFromJsonAsync<T>(uri);
        }
    }
}
