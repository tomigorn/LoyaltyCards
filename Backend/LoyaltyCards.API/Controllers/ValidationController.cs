using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class ValidationController : ControllerBase
{
    [HttpGet("rules")]
    public IActionResult GetValidationRules()
    {
        var rules = RegistrationValidationRules.Instance;
        return Ok(new
        {
            password = new
            {
                rules.Password.MinLength,
                rules.Password.RequireUppercase,
                rules.Password.RequireLowercase,
                rules.Password.RequireDigits,
                rules.Password.RequireSpecialCharacters,
                rules.Password.SpecialCharacters,
                rules.Password.ErrorMessages
            },
            email = new
            {
                rules.Email.Pattern,
                rules.Email.ErrorMessages
            }
        });
    }
}