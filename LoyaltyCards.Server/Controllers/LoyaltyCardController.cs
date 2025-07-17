using LoyaltyCards.Server.Data;
using LoyaltyCards.Server.DTOs;
using LoyaltyCards.Server.Helpers;
using LoyaltyCards.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        public LoyaltyCardController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("CreateCard")]
        public async Task<IActionResult> CreateCard(LoyaltyCardCreateDTO dto)
        {
            var appUserId = GetUserId();

            var card = new LoyaltyCard
            {
                Title = dto.Title,
                ShopName = dto.ShopName,
                Description = dto.Description,
                EncryptedCardNumber = EncryptionHelper.Encrypt(dto.CardNumber),
                EncryptedPin = string.IsNullOrWhiteSpace(dto.Pin) ? null : EncryptionHelper.Encrypt(dto.Pin),
                AppUserId = appUserId,
            };

            _context.LoyaltyCards.Add(card);
            await _context.SaveChangesAsync();

            return Ok("New card saved.");
        }

        [HttpGet("GetCards")]
        public IActionResult GetCards()
        {
            var appUserId = GetUserId();
            var cards = _context.LoyaltyCards
                .Where(c => c.AppUserId == appUserId)
                .Select(c => new LoyaltyCardReadDTO
                {
                    Id = c.Id,
                    Title = c.Title,
                    ShopName = c.ShopName,
                    Description = c.Description
                })
                .ToList();

            return Ok(cards);
        }
    }
}
