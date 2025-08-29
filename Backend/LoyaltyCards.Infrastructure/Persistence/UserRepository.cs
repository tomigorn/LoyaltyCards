using System;
using LoyaltyCards.Domain.Entities;
using Microsoft.Data.Sqlite;

namespace LoyaltyCards.Infrastructure.Persistence;

public class UserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public void Save(User user)
    {
        _context.Users.Add(user);
        _context.SaveChanges();
    }

    public bool ExistsByEmail(string email)
    {
        return _context.Users.Any(u => u.Email == email);
    }
    
    public User? GetByEmail(string email)
    {
        return _context.Users.FirstOrDefault(u => u.Email == email);
    } 
}