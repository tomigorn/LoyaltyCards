namespace LoyaltyCards.Server.DTOs
{
    public class LoyaltyCardCreateDTO
    {
        public string Title { get; set; } = string.Empty;
        public string ShopName { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string? Pin {  get; set; }
        public string? Description { get; set; }
        public string UserPassword { get; set; } = string.Empty;
    }
}
