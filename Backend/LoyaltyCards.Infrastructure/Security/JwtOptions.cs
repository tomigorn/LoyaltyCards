namespace LoyaltyCards.Infrastructure.Security;

public class JwtOptions
{
    public string Secret { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";

    public string TokenExpiryUnit { get; set; } = "days";
    public int TokenExpiryTime { get; set; } = 60;
}