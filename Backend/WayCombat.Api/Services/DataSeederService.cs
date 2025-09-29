using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Data;
using WayCombat.Api.Models;

namespace WayCombat.Api.Services
{
    public class DataSeederService
    {
        private readonly WayCombatDbContext _context;

        public DataSeederService(WayCombatDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            const string adminEmail = "admin@waycombat.com";
            const string adminPassword = "admin123";
            
            // Buscar admin existente
            var adminExistente = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == adminEmail);
            
            if (adminExistente != null)
            {
                // Actualizar el hash si existe
                var correctHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, 11);
                adminExistente.ContraseñaHash = correctHash;
                adminExistente.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return;
            }

            // Si no existe, crear usuario admin con ID 1
            var existeId1 = await _context.Usuarios.AnyAsync(u => u.Id == 1);
            
            if (!existeId1)
            {
                // Generar hash correcto para admin123
                var correctHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, 11);
                
                // Insertar directamente con ID 1 usando SQL raw
                await _context.Database.ExecuteSqlRawAsync(
                    "INSERT INTO Usuarios (Id, Email, Nombre, ContraseñaHash, Rol, Activo, FechaCreacion, FechaActualizacion) VALUES (1, @email, @nombre, @hash, @rol, 1, datetime('now'), datetime('now'))",
                    new Microsoft.Data.Sqlite.SqliteParameter("@email", adminEmail),
                    new Microsoft.Data.Sqlite.SqliteParameter("@nombre", "Administrador"),
                    new Microsoft.Data.Sqlite.SqliteParameter("@hash", correctHash),
                    new Microsoft.Data.Sqlite.SqliteParameter("@rol", "admin")
                );
            }
            else
            {
                // Si ID 1 está ocupado, crear con autoincrement normal
                var admin = new Usuario
                {
                    Email = adminEmail,
                    Nombre = "Administrador",
                    ContraseñaHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, 11),
                    Rol = "admin",
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow
                };

                _context.Usuarios.Add(admin);
                await _context.SaveChangesAsync();
            }

            // No crear mixes mock - que los usuarios creen su contenido real
            // Versión actualizada: Admin preferentemente con ID 1
        }
    }
}