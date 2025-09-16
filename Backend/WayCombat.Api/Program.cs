using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Collections;
using WayCombat.Api.Data;
using WayCombat.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Helper method to convert Render DATABASE_URL to Npgsql connection string
static string ConvertRenderDatabaseUrl(string databaseUrl)
{
    try
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        
        // Use default PostgreSQL port 5432 if no port is specified
        var port = uri.Port > 0 ? uri.Port : 5432;
        
        return $"Host={uri.Host};Port={port};Database={uri.LocalPath.Substring(1)};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    }
    catch (Exception ex)
    {
        throw new InvalidOperationException($"Failed to parse DATABASE_URL: {ex.Message}");
    }
}

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configurar para usar camelCase en JSON
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configure Entity Framework - Dual Database Support
var environment = builder.Environment.EnvironmentName;
var usePostgreSQL = builder.Configuration.GetValue<bool>("UsePostgreSQL");

Console.WriteLine($"🔧 Environment: {environment}");
Console.WriteLine($"🔧 UsePostgreSQL: {usePostgreSQL}");
Console.WriteLine($"🔧 DATABASE_URL exists: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"))}");

// Log environment variables for debugging
Console.WriteLine("🔧 Environment Variables Debug:");
foreach (DictionaryEntry env in Environment.GetEnvironmentVariables())
{
    var key = env.Key?.ToString() ?? "";
    if (key.Contains("DATABASE") || key.Contains("ASPNET") || key.Contains("JWT") || key.Contains("PORT") || key.Contains("PRODUCTION"))
    {
        Console.WriteLine($"   {key}: {(key.Contains("JWT") || key.Contains("DATABASE") ? "[HIDDEN]" : env.Value)}");
    }
}

builder.Services.AddDbContext<WayCombatDbContext>(options =>
{
    if (usePostgreSQL || environment == "Production")
    {
        // PostgreSQL for Production (Render)
        var configConnectionString = builder.Configuration.GetConnectionString("PostgreSQLConnection");
        var envConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
        
        Console.WriteLine($"🔍 Debug DbContext Config:");
        Console.WriteLine($"   - Config connection string: {(string.IsNullOrEmpty(configConnectionString) ? "NULL/EMPTY" : "EXISTS")}");
        Console.WriteLine($"   - Environment DATABASE_URL: {(string.IsNullOrEmpty(envConnectionString) ? "NULL/EMPTY" : "EXISTS")}");
        
        // Use DATABASE_URL if config connection string is null or empty
        var connectionString = !string.IsNullOrEmpty(configConnectionString) ? configConnectionString : envConnectionString;
        
        Console.WriteLine($"   - Final connection string: {(string.IsNullOrEmpty(connectionString) ? "NULL/EMPTY" : "EXISTS")}");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            Console.WriteLine("❌ CONNECTION STRING IS NULL OR EMPTY!");
            Console.WriteLine($"   - usePostgreSQL: {usePostgreSQL}");
            Console.WriteLine($"   - environment: {environment}");
            Console.WriteLine($"   - configConnectionString: '{configConnectionString}'");
            Console.WriteLine($"   - envConnectionString: '{envConnectionString}'");
            throw new InvalidOperationException("DATABASE_URL environment variable is not set or PostgreSQLConnection is not configured.");
        }
        
        // Convert Render DATABASE_URL format to Npgsql connection string
        if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
        {
            connectionString = ConvertRenderDatabaseUrl(connectionString);
        }
        
        options.UseNpgsql(connectionString);
        Console.WriteLine("🐘 Using PostgreSQL database");
        Console.WriteLine($"📍 Connection configured for host: {new Uri(Environment.GetEnvironmentVariable("DATABASE_URL") ?? "postgres://localhost").Host}");
    }
    else
    {
        // SQLite for Development
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
        Console.WriteLine("🗄️ Using SQLite database");
    }
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Configure CORS - Development and Production
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        var allowedOrigins = new List<string>
        {
            // Development origins
            "http://localhost:4200", 
            "http://localhost:4201", 
            "http://localhost:4202", 
            "http://localhost:4203", 
            "http://localhost:4204"
        };

        // Add production origin if configured
        var productionOrigin = builder.Configuration["ProductionOrigin"];
        if (!string.IsNullOrEmpty(productionOrigin))
        {
            allowedOrigins.Add(productionOrigin);
        }

        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IMixService, MixService>();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo 
    { 
        Title = "WayCombat API", 
        Version = "v1",
        Description = "API para la aplicación Way Combat"
    });

    // Configure JWT authentication in Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WayCombat API V1");
        c.RoutePrefix = string.Empty; // Para que Swagger esté en la raíz
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint for Render
app.MapGet("/health", () => new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
    database = "connected"
});

// Auto migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<WayCombatDbContext>();
    try
    {
        Console.WriteLine("🔄 Starting database migration...");
        
        // Test the connection first
        await context.Database.CanConnectAsync();
        Console.WriteLine("✅ Database connection successful");
        
        // Apply migrations
        await context.Database.MigrateAsync();
        Console.WriteLine("✅ Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database migration failed: {ex.Message}");
        Console.WriteLine($"🔍 Stack trace: {ex.StackTrace}");
        
        // Check environment variables for debugging
        Console.WriteLine("📊 Environment Variables:");
        Console.WriteLine($"   ASPNETCORE_ENVIRONMENT: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}");
        Console.WriteLine($"   DATABASE_URL exists: {!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"))}");
        
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")))
        {
            var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            Console.WriteLine($"   DATABASE_URL format: {dbUrl?.Substring(0, Math.Min(30, dbUrl.Length))}...");
        }
        
        throw; // Re-throw the exception to prevent the app from starting with a broken database
    }
}

await app.RunAsync();
