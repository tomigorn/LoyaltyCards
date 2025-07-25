using LoyaltyCards.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyaltyCards.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<LoyaltyCard> LoyaltyCards { get; set; }
        public DbSet<UserEncryptionKey> UserEncryptionKeys { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AppUser>()
                .HasOne(u => u.UserEncryptionKey)
                .WithOne(k => k.AppUser)
                .HasForeignKey<UserEncryptionKey>(k => k.AppUserId);
        }
    }
}
