using System.Text.Json;

public class RegistrationValidationRules
{
    private static readonly Lazy<RegistrationValidationRules> _instance = new(() => LoadRules());
    public static RegistrationValidationRules Instance => _instance.Value;

    public PasswordRules Password { get; set; } = null!;
    public EmailRules Email { get; set; } = null!;

    private static RegistrationValidationRules LoadRules()
    {
        try
        {
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            var projectRoot = Path.GetFullPath(Path.Combine(basePath, "../../../../../"));
            var filePath = Path.Combine(projectRoot, "Shared", "validation-rules.json");

            Console.WriteLine($"Looking for validation rules at: {filePath}");

            if (!File.Exists(filePath))
                throw new FileNotFoundException($"Validation rules file not found at: {filePath}");

            var json = File.ReadAllText(filePath);
            Console.WriteLine($"Loaded JSON: {json}");

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = true
            };

            var rules = JsonSerializer.Deserialize<RegistrationValidationRules>(json, options);

            if (rules?.Password == null || rules?.Email == null)
                throw new InvalidOperationException("Validation rules were not properly deserialized");

            return rules;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading validation rules: {ex}");
            throw;
        }
    }

    public class PasswordRules
    {
        public int MinLength { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireDigits { get; set; }
        public bool RequireSpecialCharacters { get; set; }
        public string SpecialCharacters { get; set; } = string.Empty;
        public Dictionary<string, string> ErrorMessages { get; set; } = new();
    }

    public class EmailRules
    {
        public string Pattern { get; set; } = string.Empty;
        public Dictionary<string, string> ErrorMessages { get; set; } = new();
    }
}