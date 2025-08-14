using System;

namespace LoyaltyCards.API.DTO;

public class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
