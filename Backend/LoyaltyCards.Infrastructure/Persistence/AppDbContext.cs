using LoyaltyCards.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyaltyCards.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }


        public DbSet<User> Users { get; set; }
        public DbSet<LoyaltyCard> LoyaltyCards { get; set; }

        // Configure entity relationships and constraints
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Email)
                      .IsUnique();
            });


            // LoyaltyCard
            modelBuilder.Entity<LoyaltyCard>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
