using System;

namespace LoyaltyCards.API.DTO;

public class LoginRequestDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
