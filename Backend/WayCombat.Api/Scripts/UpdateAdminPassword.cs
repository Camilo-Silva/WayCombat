using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WayCombat.Api.Data;
using BCrypt.Net;

namespace WayCombat.Api.Scripts;

public class UpdateAdminPassword
{
    public static async Task Main(string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);
        
        // Configurar Entity Framework
        builder.Services.AddDbContext<WayCombatDbContext>(options =>
            options.UseSqlite("Data Source=waycombat_dev.db"));

        var host = builder.Build();

        using var scope = host.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WayCombatDbContext>();

        // Generar nuevo hash para admin123
        var password = "admin123";
        var newHash = BCrypt.Net.BCrypt.HashPassword(password, 11);
        
        Console.WriteLine($"Nueva contraseña: {password}");
        Console.WriteLine($"Nuevo hash: {newHash}");
        
        // Verificar que el hash funciona
        var verification = BCrypt.Net.BCrypt.Verify(password, newHash);
        Console.WriteLine($"Verificación del hash: {verification}");

        // Buscar admin
        var admin = await context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == "admin@waycombat.com");

        if (admin != null)
        {
            Console.WriteLine($"Admin encontrado - ID: {admin.Id}");
            Console.WriteLine($"Hash actual: {admin.ContraseñaHash}");
            
            // Actualizar el hash
            admin.ContraseñaHash = newHash;
            admin.FechaActualizacion = DateTime.UtcNow;
            
            await context.SaveChangesAsync();
            Console.WriteLine("Hash actualizado correctamente!");
            
            // Verificar la actualización
            var updatedAdmin = await context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == "admin@waycombat.com");
            Console.WriteLine($"Hash verificado en BD: {updatedAdmin?.ContraseñaHash}");
        }
        else
        {
            Console.WriteLine("Admin no encontrado!");
        }
    }
}