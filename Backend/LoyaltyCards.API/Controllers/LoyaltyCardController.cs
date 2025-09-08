using System.Security.Claims;
using LoyaltyCards.API.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoyaltyCards.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LoyaltyCardController : ControllerBase
    {
        private readonly LoyaltyCardService _loyaltyCardService;

        public LoyaltyCardController(LoyaltyCardService loyaltyCardService)
        {
            _loyaltyCardService = loyaltyCardService;
        }

        [HttpPost("createLoyaltyCard")]
        public IActionResult CreateLoyaltyCard([FromBody] LoyaltyCardRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                var userGuid = Guid.Parse(userId);

                var storeName = request.StoreName ?? request.Nickname;

                _loyaltyCardService.CreateCard(
                    request.Nickname,
                    storeName,
                    request.BarcodeNumber,
                    userGuid
                );

                return Ok("Loyalty card created successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("getAllLoyaltyCards")]
        public IActionResult GetAllLoyaltyCards()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                var userGuid = Guid.Parse(userId);

                var cards = _loyaltyCardService.GetAllCards(userGuid);
                return Ok(new LoyaltyCardListResponseDto
                {
                    TotalCount = cards.Count(),
                    Cards = cards
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // TODO: Additional endpoints (Get, Update, Delete) can be added here
    }
}