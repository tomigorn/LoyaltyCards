# Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["LoyaltyCards.API/LoyaltyCards.API.csproj", "LoyaltyCards.API/"]
RUN dotnet restore "LoyaltyCards.API/LoyaltyCards.API.csproj"
COPY . .
WORKDIR "/src/LoyaltyCards.API"
RUN dotnet build "LoyaltyCards.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "LoyaltyCards.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# optionally create folder for SQLite
RUN mkdir -p /app/Data
# optionally set a non-root user
# RUN adduser --disabled-password app && chown -R app /app
# USER app

ENTRYPOINT ["dotnet", "LoyaltyCards.API.dll"]
