using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WayCombat.Api.Models
{
    public class ArchivoMix
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MixId { get; set; }

        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } = string.Empty; // Audio, Video, Imagen

        [Required]
        [StringLength(200)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string URL { get; set; } = string.Empty; // URL de Google Drive

        [StringLength(100)]
        public string? MimeType { get; set; }

        public long? TamañoBytes { get; set; }

        public int Orden { get; set; } = 0;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        public bool Activo { get; set; } = true;

        // Navegación
        [ForeignKey("MixId")]
        public virtual Mix Mix { get; set; } = null!;
    }
}
