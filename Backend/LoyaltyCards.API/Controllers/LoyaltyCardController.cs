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

                _loyaltyCardService.CreateCard(
                    request.Nickname,
                    request.StoreName,
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

        [HttpPut("updateLoyaltyCard/{id}")]
        public IActionResult UpdateLoyaltyCard(Guid id, [FromBody] LoyaltyCardRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                var userGuid = Guid.Parse(userId);

                _loyaltyCardService.UpdateCard(
                    id,
                    request.Nickname,
                    request.StoreName,
                    request.BarcodeNumber,
                    userGuid
                );

                return Ok("Loyalty card updated successfully");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Loyalty card not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("You don't have permission to update this card");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("deleteLoyaltyCard/{id}")]
        public IActionResult DeleteLoyaltyCard(Guid id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                var userGuid = Guid.Parse(userId);

                _loyaltyCardService.DeleteCard(id, userGuid);
                return Ok("Loyalty card deleted successfully");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Loyalty card not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("You don't have permission to delete this card");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}