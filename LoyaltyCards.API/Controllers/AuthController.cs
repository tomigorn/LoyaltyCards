using LoyaltyCards.API.DTO;
using Microsoft.AspNetCore.Mvc;

namespace LoyaltyCards.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            return Ok();
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            return Ok();
        }

    }
}
