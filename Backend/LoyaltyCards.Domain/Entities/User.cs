using System;

namespace LoyaltyCards.Domain.Entities;

public class User
{
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public bool EmailIsVerified { get; set; } = false;
        public string PasswordHash { get; set; } = null!;
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginDate { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }
}
