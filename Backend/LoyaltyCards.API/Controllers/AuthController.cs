using LoyaltyCards.API.DTO;
using LoyaltyCards.Application.Users;
using Microsoft.AspNetCore.Mvc;

namespace LoyaltyCards.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserRegistrationService _userRegistrationService;
        
        public AuthController(UserRegistrationService userRegistrationService)
        {
            _userRegistrationService = userRegistrationService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                if (request.Password != request.ConfirmPassword)
                    return BadRequest("Password and Confirm Password do not match.");

                _userRegistrationService.Register(request.Email, request.Password);

                return Ok("User registered successfully");
            }
            catch (Exception ex)
            {
                // Return error message (simplified)
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDto request)
        {
            try
            {
                _userRegistrationService.Login(request.Email, request.Password);
                
                return Ok("User logged in successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
}

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // This is just for API completeness
            // The client should discard the token
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
