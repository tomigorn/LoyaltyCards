namespace LoyaltyCards.Server.Models
{
    public class AppUser
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public UserEncryptionKey UserEncryptionKey { get; set; }
        public ICollection<LoyaltyCard> LoyaltyCards { get; set; } = new List<LoyaltyCard>();
    }
}
