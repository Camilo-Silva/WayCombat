using System.ComponentModel.DataAnnotations;

namespace WayCombat.Api.Models
{
    public class Mix
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Descripcion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        public bool Activo { get; set; } = true;

        // Navegación
        public virtual ICollection<ArchivoMix> ArchivoMixes { get; set; } = new List<ArchivoMix>();
        public virtual ICollection<AccesoMix> AccesoMixes { get; set; } = new List<AccesoMix>();
    }
}
