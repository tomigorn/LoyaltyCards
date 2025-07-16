namespace LoyaltyCards.Server.Models
{
    public class AppUser
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
    }
}
