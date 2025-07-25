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
        public string CardNonce { get; set; }
        public string CardTag { get; set; }

        public string? EncryptedPin { get; set; }
        public string? PinNonce { get; set; }
        public string? PinTag { get; set; }

        [Required]
        public Guid AppUserId { get; set; }
        public AppUser? AppUser { get; set; }
    }
}
