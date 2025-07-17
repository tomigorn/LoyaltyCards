using LoyaltyCards.Server.Data;
using LoyaltyCards.Server.DTOs;
using LoyaltyCards.Server.Helpers;
using LoyaltyCards.Server.Models;
using LoyaltyCards.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;
using System.Security.Claims;

namespace LoyaltyCards.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoyaltyCardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IKeyCacheService _keyCacheService;
        public LoyaltyCardController(AppDbContext context, IKeyCacheService keyCacheService)
        {
            _context = context;
            _keyCacheService = keyCacheService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("CreateCard")]
        public async Task<IActionResult> CreateCard(LoyaltyCardCreateDTO dto)
        {
            var appUserId = GetUserId();
            var user = await _context.AppUsers.FindAsync(appUserId);
            var encryption = await _context.UserEncryptionKeys.FirstOrDefaultAsync(e => e.AppUserId == appUserId);

            if (user == null || encryption == null)
            {
                return Unauthorized("User not found");
            }
            var key = AesEncryptionHelper.DeriveKey(dto.UserPassword, encryption.Salt);

            var (cardCipher, cardNonce, cardTag) = AesEncryptionHelper.Encrypt(dto.CardNumber, key);
            byte[]? pinCipher = null, pinNonce = null, pinTag = null;
            if (!string.IsNullOrWhiteSpace(dto.Pin))
            {
                (pinCipher, pinNonce, pinTag) = AesEncryptionHelper.Encrypt(dto.Pin, key);
            }

            var card = new LoyaltyCard
            {
                Title = dto.Title,
                ShopName = dto.ShopName,
                Description = dto.Description,
                EncryptedCardNumber = Convert.ToBase64String(cardCipher),
                CardNonce = Convert.ToBase64String(cardNonce),
                CardTag = Convert.ToBase64String(cardTag),
                EncryptedPin = pinCipher != null ? Convert.ToBase64String(pinCipher) : null,
                PinNonce = pinNonce != null ? Convert.ToBase64String(pinNonce) : null,
                PinTag = pinTag != null ? Convert.ToBase64String(pinTag) : null,
                AppUserId = appUserId,
            };

            _context.LoyaltyCards.Add(card);
            await _context.SaveChangesAsync();

            return Ok("New card saved.");
        }

        [HttpGet("GetCards")]
        public async Task<IActionResult> GetCards()
        {
            var userId = GetUserId();

            if (!_keyCacheService.TryGetKey(userId, out var key))
                return Unauthorized("Encryption key not unlocked. Please unlock with password first.");

            var cards = await _context.LoyaltyCards
                .Where(c => c.AppUserId == userId)
                .ToListAsync();

            var result = new List<LoyaltyCardReadDTO>();

            foreach (var card in cards)
            {
                var dto = new LoyaltyCardReadDTO
                {
                    Id = card.Id,
                    Title = card.Title,
                    ShopName = card.ShopName,
                    Description = card.Description
                };

                try
                {
                    var cardNumber = AesEncryptionHelper.Decrypt(
                        Convert.FromBase64String(card.EncryptedCardNumber),
                        Convert.FromBase64String(card.CardNonce),
                        Convert.FromBase64String(card.CardTag),
                        key
                    );
                    dto.CardNumber = cardNumber;

                    if (!string.IsNullOrEmpty(card.EncryptedPin))
                    {
                        var pin = AesEncryptionHelper.Decrypt(
                            Convert.FromBase64String(card.EncryptedPin),
                            Convert.FromBase64String(card.PinNonce!),
                            Convert.FromBase64String(card.PinTag!),
                            key
                        );
                        dto.Pin = pin;
                    }
                }
                catch
                {
                    return BadRequest("Decryption failed. Possibly wrong encryption key.");
                }

                result.Add(dto);
            }

            return Ok(result);
        }
    }
}
