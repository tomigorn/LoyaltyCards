using LoyaltyCards.Server.Data;
using LoyaltyCards.Server.DTOs;
using LoyaltyCards.Server.Helpers;
using LoyaltyCards.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace LoyaltyCards.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtSettings _jwtSettings;
        private readonly PasswordHasher<AppUser> _passwordHasher;

        public AuthController(AppDbContext context, IOptions<JwtSettings> jwtOptions)
        {
            _context = context;
            _jwtSettings = jwtOptions.Value;
            _passwordHasher = new PasswordHasher<AppUser>();
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginRequest request)
        {
            var user = _context.AppUsers.FirstOrDefault(u =>
                u.Email == request.Email);

            var verifiedHashedPasswordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if (user == null || verifiedHashedPasswordResult!=PasswordVerificationResult.Success)
            {
                return Unauthorized("Invalid username or password");
            }

            var token = JwtHelper.GenerateToken(user.Email, _jwtSettings);
            return Ok(new { token });
        }

    }
}
