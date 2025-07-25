using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace LoyaltyCards.Shared
{
    public class PasswordComplexityAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            if (value is not string password) return false;

            var pattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$";
            return Regex.IsMatch(password, pattern);
        }

        public override string FormatErrorMessage(string name)
        {
            return "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
        }
    }
}
