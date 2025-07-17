namespace LoyaltyCards.Server.DTOs
{
    public class LoyaltyCardReadDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ShopName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CardNumber { get; set; }
        public string? Pin { get; set; }

    }
}
