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

            // NO MÁS SEED DATA AQUÍ - Se movió a un DataSeeder separado
            // para evitar que resetee la BD en cada migración
        }
    }
}
