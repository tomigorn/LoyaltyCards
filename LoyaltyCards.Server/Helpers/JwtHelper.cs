using LoyaltyCards.Server.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

/// <summary>
/// JWT = JSON Web Token
/// URL-safe way to represent claims between two parties.
/// the token contains 3 parts:
/// Header - metadata like the signing algorithm
/// Payload - data claims like user ID, email, roles, expiration time.
/// Signature - cryptographic signature to verify the token and it's integrity.
/// 
/// When the user logs in successfully, the server creates a JWT with the user's identity info.
/// This token is sent back to the client.
/// On future requests, the client sends the token.
/// The server verifies the token's signature and extracts the user info from the payload to authorize the actions without needing to query the DB every time.
/// </summary>
public static class JwtHelper
{
    public static Guid? GetUserIdFromRequest(HttpContext context)
    {
        var identity = context.User.Identity as ClaimsIdentity;
        var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return null;

        return Guid.TryParse(userIdClaim.Value, out var guid) ? guid : null;
    }

    public static string GenerateToken(Guid userId, string email, JwtSettings settings)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: settings.Issuer,
            audience: settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(settings.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
