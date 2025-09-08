using Microsoft.AspNetCore.Mvc;

namespace LoyaltyCards.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoyaltyCardController : ControllerBase
    {
        private readonly LoyaltyCardService _loyaltyCardService;

        public LoyaltyCardController(LoyaltyCardService loyaltyCardService)
        {
            _loyaltyCardService = loyaltyCardService;
        }

        [HttpPost]
        public IActionResult CreateLoyaltyCard([FromBody] LoyaltyCardRequestDto request)
        {
            try
            {
                var storeName = request.StoreName ?? request.Nickname;

                _loyaltyCardService.CreateCard(
                    request.Nickname, 
                    storeName, 
                    request.BarcodeNumber, 
                    Guid.Parse("C57DA98B-6764-4DC9-910C-1FF95F3D6512")
                );

                return Ok("Loyalty card created successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Additional endpoints (Get, Update, Delete) can be added here
    }
}