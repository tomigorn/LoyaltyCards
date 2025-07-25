using LoyaltyCards.Server.Data;
using LoyaltyCards.Server.DTOs;
using LoyaltyCards.Server.Helpers;
using LoyaltyCards.Server.Models;
using LoyaltyCards.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly IKeyCacheService _keyCacheService;

        public AuthController(AppDbContext context, IOptions<JwtSettings> jwtOptions, IKeyCacheService keyCacheService)
        {
            _context = context;
            _jwtSettings = jwtOptions.Value;
            _passwordHasher = new PasswordHasher<AppUser>();
            _keyCacheService = keyCacheService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDTO dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);

                return BadRequest(string.Join(" ", errors));
            }

            var existingUser = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return BadRequest("User with this Email already exists.");
            }

            var user = new AppUser
            {
                Email = dto.Email
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            _context.AppUsers.Add(user);
            await _context.SaveChangesAsync();

            var salt = RandomNumberGenerator.GetBytes(16);
            var encryptionKey = new UserEncryptionKey
            {
                AppUser = user,
                Salt = salt
            };
            _context.UserEncryptionKeys.Add(encryptionKey);
            await _context.SaveChangesAsync();

            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO request)
        {
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return Unauthorized("Invalid username or password");
            }

            var verifiedHashedPasswordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (verifiedHashedPasswordResult != PasswordVerificationResult.Success)
            {
                return Unauthorized("Invalid username or password");
            }

            var encryption = await _context.UserEncryptionKeys.FirstOrDefaultAsync(e => e.AppUserId == user.Id);
            if (encryption == null)
            {
                return Unauthorized("Encryption info not found");
            }

            var key = AesEncryptionHelper.DeriveKey(request.Password, encryption.Salt);

            _keyCacheService.StoreKey(user.Id, key);

            var token = JwtHelper.GenerateToken(user.Id, user.Email, _jwtSettings);

            return Ok(new { token });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var userId = JwtHelper.GetUserIdFromRequest(HttpContext);
            if (userId != null)
            {
                _keyCacheService.RemoveKey(userId.Value);
            }

            return Ok("Logged out successfully.");
        }


    }
}
