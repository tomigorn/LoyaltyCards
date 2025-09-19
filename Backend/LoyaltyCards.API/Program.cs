using System.IO;
using System.Text;
using LoyaltyCards.Application.Users;
using LoyaltyCards.Infrastructure.Persistence;
using LoyaltyCards.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// bind JwtOptions from config
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
// register JwtTokenService (uses IOptions<JwtOptions>)
builder.Services.AddSingleton<JwtTokenService>();

// compute DB path inside container or local dev reliably
var dbFile = Path.Combine(AppContext.BaseDirectory, "Data", "app.db");
// ensure directory exists
Directory.CreateDirectory(Path.GetDirectoryName(dbFile)!);

// override configuration connection string
builder.Configuration["ConnectionStrings:DefaultConnection"] = $"Data Source={dbFile}";

// Add services to the container.

// Add JWT configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["Jwt:Secret"] 
                        ?? throw new InvalidOperationException("JWT secret is not configured.");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// SqLite: DB Connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<UserRegistrationService>();
builder.Services.AddScoped<LoyaltyCardRepository>();
builder.Services.AddScoped<LoyaltyCardService>();

builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Loyalty Cards API", Version = "v1" });
    
    // Add JWT Authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// health check
builder.Services.AddHealthChecks();

var app = builder.Build();

// SqLite: Apply migrations at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Development environment specific things 
if (app.Environment.IsDevelopment())
{
    // Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}

// API health check
app.MapHealthChecks("/health");

// CORS
app.UseCors("DevCors");

// HTTPS only, API Authorization needed
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
