var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

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
