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
            // Solo seed si la BD está vacía para evitar resetear datos existentes
            if (await _context.Usuarios.AnyAsync())
            {
                // Ya hay datos, no hacer nada
                return;
            }

            // Crear usuario admin solo si no existe
            if (!await _context.Usuarios.AnyAsync(u => u.Email == "admin@waycombat.com"))
            {
                var admin = new Usuario
                {
                    Email = "admin@waycombat.com",
                    Nombre = "Administrador",
                    ContraseñaHash = "$2b$12$RUkztah0eZ97UsyYVqU9betRS67GhIqEGIWpuj41uiefD/rqIuIRm", // admin123
                    Rol = "admin",
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow
                };

                _context.Usuarios.Add(admin);
                await _context.SaveChangesAsync();
            }

            // No crear mixes mock - que los usuarios creen su contenido real
        }
    }
}