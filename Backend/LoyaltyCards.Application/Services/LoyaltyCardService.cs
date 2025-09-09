using LoyaltyCards.Application.Models;
using LoyaltyCards.Domain.Entities;
using LoyaltyCards.Infrastructure.Persistence;

public class LoyaltyCardService
{
    private readonly LoyaltyCardRepository _repository;

    public LoyaltyCardService(LoyaltyCardRepository repository)
    {
        _repository = repository;
    }

    public IEnumerable<SimplifiedLoyaltyCardModel> GetAllCards(Guid userId)
    {
        var cards = _repository.GetByUserId(userId)
            .Select(c => new SimplifiedLoyaltyCardModel
            {
                Id = c.Id,
                Nickname = c.Nickname,
                StoreName = c.StoreName,
                BarcodeNumber = c.BarcodeNumber,
                CreationDate = c.CreationDate
            })
            .ToList();

        return cards;
    }

    public void CreateCard(string nickname, string? storeName, string barcodeNumber, Guid userId)
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