namespace LoyaltyCards.Application.Models;

public class SimplifiedLoyaltyCardModel
{
    public Guid Id { get; set; }
    public string Nickname { get; set; }
    public string StoreName { get; set; }
    public string BarcodeNumber { get; set; }
    public DateTime CreationDate { get; set; }
}