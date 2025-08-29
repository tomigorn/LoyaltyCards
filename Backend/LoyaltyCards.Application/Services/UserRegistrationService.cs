using System;
using LoyaltyCards.Domain.Entities;
using LoyaltyCards.Infrastructure.Persistence;
using LoyaltyCards.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace LoyaltyCards.Application.Users;

public class UserRegistrationService
{
    private readonly PasswordHasher _hasher;
    private readonly UserRepository _repository;

    public UserRegistrationService(UserRepository repository)
    {
        _hasher = new PasswordHasher();
        _repository = repository;
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

    public void Login(string email, string password)
    {
        var user = _repository.GetByEmail(email);
        if (user == null)
            throw new Exception("Invalid email or password.");

        bool valid = _hasher.Verify(password, user.PasswordHash);
        if (!valid)
            throw new Exception("Invalid email or password.");

    }
}
