using System;

namespace LoyaltyCards.Domain.Entities;

public class User
{
        public Guid Id { get; set; }
        public string Email { get; set; } = null!; // TODO: send verification email on registration
        public bool EmailIsVerified { get; set; } = false; // TODO: Implement email verification process
        public string PasswordHash { get; set; } = null!;
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginDate { get; set; } // TODO: Update on successful login
        public int FailedLoginAttempts { get; set; } = 0; // TODO: Increment on failed login, reset on successful login
        public DateTime? LockoutEnd { get; set; } // TODO: Set if account is locked out due to too many failed login attempts
}
