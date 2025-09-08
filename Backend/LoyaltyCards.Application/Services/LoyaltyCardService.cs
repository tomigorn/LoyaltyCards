using LoyaltyCards.Domain.Entities;
using LoyaltyCards.Infrastructure.Persistence;

public class LoyaltyCardService
{
    private readonly LoyaltyCardRepository _repository;

    public LoyaltyCardService(LoyaltyCardRepository repository)
    {
        _repository = repository;
    }

    public void CreateCard(string nickname, string storeName, string barcodeNumber, Guid userId)
    {
        var card = new LoyaltyCard
        {
            Id = Guid.NewGuid(),
            Nickname = nickname,
            StoreName = storeName ?? nickname,
            BarcodeNumber = barcodeNumber,
            UserId = userId,
            CreationDate = DateTime.UtcNow
        };

        _repository.Save(card);
    }
}