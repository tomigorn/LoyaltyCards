using LoyaltyCards.Server.Data;
using LoyaltyCards.Server.DTOs;
using LoyaltyCards.Server.Helpers;
using LoyaltyCards.Server.Models;
using LoyaltyCards.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;

namespace LoyaltyCards.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly KeyCacheService _keyCacheService;

        public UserController(AppDbContext context, KeyCacheService keyCacheService)
        {
            _context = context;
            _keyCacheService = keyCacheService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("UnlockKey")]
        public async Task<IActionResult> UnlockKey([FromBody] UnlockKeyRequest request)
        {
            var userId = GetUserId();

            var user = await _context.AppUsers
                .Include(u => u.UserEncryptionKey)
                .SingleOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Unauthorized("User not found");

            if (user.UserEncryptionKey == null)
                return BadRequest("User encryption key missing");

            var key = AesEncryptionHelper.DeriveKey(request.UserPassword, user.UserEncryptionKey.Salt);

            _keyCacheService.StoreKey(userId, key);

            return Ok("Encryption key unlocked and cached.");
        }
    }
}
