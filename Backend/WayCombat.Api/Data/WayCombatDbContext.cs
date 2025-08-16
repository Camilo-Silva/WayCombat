using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Models;

namespace WayCombat.Api.Data
{
    public class WayCombatDbContext : DbContext
    {
        public WayCombatDbContext(DbContextOptions<WayCombatDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Mix> Mixes { get; set; }
        public DbSet<ArchivoMix> ArchivoMixes { get; set; }
        public DbSet<AccesoMix> AccesoMixes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuraciones de entidades
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ContraseñaHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Rol).IsRequired().HasMaxLength(50).HasDefaultValue("Usuario");
            });

            modelBuilder.Entity<Mix>(entity =>
            {
                entity.Property(e => e.Titulo).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Descripcion).HasMaxLength(1000);
            });

            modelBuilder.Entity<ArchivoMix>(entity =>
            {
                entity.Property(e => e.Tipo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.URL).IsRequired().HasMaxLength(500);
                entity.Property(e => e.MimeType).HasMaxLength(100);
                
                entity.HasOne(d => d.Mix)
                    .WithMany(p => p.ArchivoMixes)
                    .HasForeignKey(d => d.MixId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AccesoMix>(entity =>
            {
                entity.HasIndex(e => new { e.UsuarioId, e.MixId }).IsUnique();
                
                entity.HasOne(d => d.Usuario)
                    .WithMany(p => p.AccesoMixes)
                    .HasForeignKey(d => d.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Mix)
                    .WithMany(p => p.AccesoMixes)
                    .HasForeignKey(d => d.MixId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed Data - Usuario Admin por defecto
            modelBuilder.Entity<Usuario>().HasData(
                new Usuario
                {
                    Id = 1,
                    Email = "admin@waycombat.com",
                    Nombre = "Administrador",
                    ContraseñaHash = "$2b$12$RUkztah0eZ97UsyYVqU9betRS67GhIqEGIWpuj41uiefD/rqIuIRm", // admin123
                    Rol = "admin",
                    FechaCreacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    FechaActualizacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed Data - Mixes básicos
            modelBuilder.Entity<Mix>().HasData(
                new Mix
                {
                    Id = 1,
                    Titulo = "Mix de Entrenamiento Básico",
                    Descripcion = "Rutinas fundamentales de Way Combat para principiantes",
                    Activo = true,
                    FechaCreacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    FechaActualizacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Mix
                {
                    Id = 2,
                    Titulo = "Mix Avanzado - Competencia", 
                    Descripcion = "Técnicas avanzadas y estrategias para competencias",
                    Activo = true,
                    FechaCreacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    FechaActualizacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Mix
                {
                    Id = 3,
                    Titulo = "Mix de Acondicionamiento",
                    Descripcion = "Ejercicios de fortalecimiento y acondicionamiento físico",
                    Activo = true,
                    FechaCreacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    FechaActualizacion = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Accesos del admin a todos los mixes
            modelBuilder.Entity<AccesoMix>().HasData(
                new AccesoMix { 
                    Id = 1, 
                    UsuarioId = 1, 
                    MixId = 1,
                    FechaAcceso = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Activo = true
                },
                new AccesoMix { 
                    Id = 2, 
                    UsuarioId = 1, 
                    MixId = 2,
                    FechaAcceso = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Activo = true
                },
                new AccesoMix { 
                    Id = 3, 
                    UsuarioId = 1, 
                    MixId = 3,
                    FechaAcceso = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Activo = true
                }
            );
        }
    }
}
