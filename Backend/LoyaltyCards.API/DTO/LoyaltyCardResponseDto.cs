using LoyaltyCards.Application.Models;

namespace LoyaltyCards.API.DTO;

public class LoyaltyCardResponseDto
{
    public Guid Id { get; set; }
    public string Nickname { get; set; }
    public string StoreName { get; set; }
    public string BarcodeNumber { get; set; }
    public DateTime CreationDate { get; set; }
}

public class LoyaltyCardListResponseDto
{
    public int TotalCount { get; set; }
    public IEnumerable<SimplifiedLoyaltyCardModel> Cards { get; set; }
}