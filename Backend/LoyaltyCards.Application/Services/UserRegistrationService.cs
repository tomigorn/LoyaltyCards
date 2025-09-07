using System;
using System.Text.RegularExpressions;
using LoyaltyCards.Domain.Entities;
using LoyaltyCards.Infrastructure.Persistence;
using LoyaltyCards.Infrastructure.Security;

namespace LoyaltyCards.Application.Users;

public class UserRegistrationService
{
    private readonly PasswordHasher _hasher;
    private readonly UserRepository _repository;
    private readonly JwtTokenService _tokenService;

    public UserRegistrationService(UserRepository repository, JwtTokenService tokenService)
    {
        _hasher = new PasswordHasher();
        _repository = repository;
        _tokenService = tokenService;
    }

    private bool IsValidPassword(string password)
    {
        var rules = RegistrationValidationRules.Instance.Password;

        if (password.Length < rules.MinLength)
            throw new ArgumentException(string.Format(rules.ErrorMessages["tooShort"], rules.MinLength));
        
        if (rules.RequireLowercase && !password.Any(char.IsLower))
            throw new ArgumentException(rules.ErrorMessages["missingLowercase"]);

        if (rules.RequireUppercase && !password.Any(char.IsUpper))
            throw new ArgumentException(rules.ErrorMessages["missingUppercase"]);
            
        if (rules.RequireDigits && !password.Any(char.IsDigit))
            throw new ArgumentException(rules.ErrorMessages["missingDigit"]);

        if (rules.RequireSpecialCharacters && !password.Any(c => rules.SpecialCharacters.Contains(c)))
            throw new ArgumentException(
                string.Format(
                    rules.ErrorMessages["missingSpecial"],
                    rules.SpecialCharacters
                )
            );

        return true;
    }

    private bool IsValidEmail(string email)
    {
        var rules = RegistrationValidationRules.Instance.Email;

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException(rules.ErrorMessages["invalid"]);

        if (!Regex.IsMatch(email, rules.Pattern))
            throw new ArgumentException(rules.ErrorMessages["invalid"]);

        return true;
    }

    public void Register(string email, string password)
    {
        if (!IsValidEmail(email))
            throw new ArgumentException("Invalid email");

        if (_repository.ExistsByEmail(email))
            throw new Exception("Email is already registered.");

        if (!IsValidPassword(password))
            throw new ArgumentException("Invalid password");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            RegistrationDate = DateTime.UtcNow
        };

        var hash = _hasher.Hash(password);
        user.PasswordHash = hash;

        _repository.Save(user);
    }

    public string Login(string email, string password, bool rememberMe = false)
    {
        var user = _repository.GetByEmail(email);
        if (user == null)
            throw new Exception("Invalid email or password.");

        bool valid = _hasher.Verify(password, user.PasswordHash);
        if (!valid)
            throw new Exception("Invalid email or password.");

        return _tokenService.GenerateToken(user, rememberMe);
    }
}
