namespace LoyaltyCards.Server.Models
{
    public class UserEncryptionKey
    {
        public Guid Id { get; set; }
        public Guid AppUserId { get; set; }
        public byte[] Salt { get; set; } = null!;

        public AppUser AppUser { get; set; } = null!;
    }
}
