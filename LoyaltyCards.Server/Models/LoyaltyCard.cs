using System.ComponentModel.DataAnnotations;

namespace LoyaltyCards.Server.Models
{
    public class LoyaltyCard
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string ShopName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [Required]
        public string EncryptedCardNumber { get; set; } = string.Empty;
        public string? EncryptedPin { get; set; }

        [Required]
        public int AppUserId { get; set; }
        public AppUser? AppUser { get; set; }
    }
}
