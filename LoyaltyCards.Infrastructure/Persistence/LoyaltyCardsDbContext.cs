using LoyaltyCards.Domain.Entities;

using Microsoft.EntityFrameworkCore;

namespace LoyaltyCards.Infrastructure.Persistence;

public class LoyaltyCardsDbContext : DbContext
{
    public LoyaltyCardsDbContext(DbContextOptions<LoyaltyCardsDbContext> options)
                : base(options)
    {

    }

    public DbSet<User> Users { get; set; }
}
