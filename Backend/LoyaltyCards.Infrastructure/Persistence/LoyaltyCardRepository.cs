using LoyaltyCards.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyaltyCards.Infrastructure.Persistence;

public class LoyaltyCardRepository
{
    private readonly AppDbContext _context;

    public LoyaltyCardRepository(AppDbContext context)
    {
        _context = context;
    }

    public void Save(LoyaltyCard card)
    {
        _context.LoyaltyCards.Add(card);
        _context.SaveChanges();
    }

    public IEnumerable<LoyaltyCard> GetByUserId(Guid userId)
    {
        return _context.LoyaltyCards
            .Where(c => c.UserId == userId)
            .ToList();
    }

    public void Update(LoyaltyCard card)
    {
        _context.LoyaltyCards.Update(card);
        _context.SaveChanges();
    }

    public void Delete(Guid id)
    {
        var card = _context.LoyaltyCards.Find(id);
        if (card != null)
        {
            _context.LoyaltyCards.Remove(card);
            _context.SaveChanges();
        }
    }
}