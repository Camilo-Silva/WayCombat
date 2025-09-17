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

            // Crear mixes básicos solo si no existen
            if (!await _context.Mixes.AnyAsync())
            {
                var mixes = new List<Mix>
                {
                    new Mix
                    {
                        Titulo = "Mix de Entrenamiento Básico",
                        Descripcion = "Rutinas fundamentales de Way Combat para principiantes",
                        Activo = true,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow
                    },
                    new Mix
                    {
                        Titulo = "Mix Avanzado - Competencia", 
                        Descripcion = "Técnicas avanzadas y estrategias para competencias",
                        Activo = true,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow
                    },
                    new Mix
                    {
                        Titulo = "Mix de Acondicionamiento",
                        Descripcion = "Ejercicios de fortalecimiento y acondicionamiento físico",
                        Activo = true,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow
                    }
                };

                _context.Mixes.AddRange(mixes);
                await _context.SaveChangesAsync();

                // Dar acceso al admin a todos los mixes
                var admin = await _context.Usuarios.FirstAsync(u => u.Email == "admin@waycombat.com");
                var accesos = new List<AccesoMix>();
                
                foreach (var mix in mixes)
                {
                    accesos.Add(new AccesoMix
                    {
                        UsuarioId = admin.Id,
                        MixId = mix.Id,
                        FechaAcceso = DateTime.UtcNow,
                        Activo = true
                    });
                }

                _context.AccesoMixes.AddRange(accesos);
                await _context.SaveChangesAsync();
            }
        }
    }
}