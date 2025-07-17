namespace LoyaltyCards.Server.Models
{
    public class UserEncryptionKey
    {
        public int Id { get; set; }
        public int AppUserId { get; set; }
        public byte[] Salt { get; set; }

        public AppUser AppUser { get; set; }
    }
}
