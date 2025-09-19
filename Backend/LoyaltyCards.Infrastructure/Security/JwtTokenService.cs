using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using LoyaltyCards.Domain.Entities;

namespace LoyaltyCards.Infrastructure.Security;

public class JwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string GenerateToken(User user, bool rememberMe = false)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        DateTime expires;
        switch (_options.TokenExpiryUnit)
        {
            case "minutes":
                expires = DateTime.UtcNow.AddMinutes(_options.TokenExpiryTime);
                break;
            case "hours":
                expires = DateTime.UtcNow.AddHours(_options.TokenExpiryTime);
                break;
            case "days":
                expires = DateTime.UtcNow.AddDays(_options.TokenExpiryTime);
                break;
            default:
                throw new InvalidOperationException("Invalid TokenExpiryUnit in JWT options");
        }

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}