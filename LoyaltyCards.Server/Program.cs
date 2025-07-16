using LoyaltyCards.Server.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add EF Core DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlite("Data Source=LoyaltyCards.db"));

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Apply migrations and create DB if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // ✅ Enable middleware to serve Swagger JSON and UI
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => Results.Content(
    @"<html>
        <body>
            <h1>Welcome to the LoyaltyCards API</h1>
            <p>Go to the <a href=""/swagger"">Swagger UI</a> to explore the API.</p>
        </body>
      </html>", "text/html"));

app.Run();
