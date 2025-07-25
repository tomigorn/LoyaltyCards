using LoyaltyCards.Shared;
using System.ComponentModel.DataAnnotations;

namespace LoyaltyCards.Server.DTOs
{
    public class UserRegisterDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [PasswordComplexity]
        public string Password { get; set; } = null!;

        [Required]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = null!;
    }
}
