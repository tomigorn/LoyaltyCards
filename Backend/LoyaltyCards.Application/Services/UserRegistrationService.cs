using System;
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

    public void Register(string email, string password)
    {
        if (_repository.ExistsByEmail(email))
            throw new Exception("Email is already registered.");

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
