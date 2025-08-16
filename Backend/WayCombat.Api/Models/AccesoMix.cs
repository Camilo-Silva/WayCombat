using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WayCombat.Api.Models
{
    public class AccesoMix
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        public int MixId { get; set; }

        public DateTime FechaAcceso { get; set; } = DateTime.UtcNow;

        public DateTime? FechaExpiracion { get; set; }

        public bool Activo { get; set; } = true;

        // Navegación
        [ForeignKey("UsuarioId")]
        public virtual Usuario Usuario { get; set; } = null!;

        [ForeignKey("MixId")]
        public virtual Mix Mix { get; set; } = null!;
    }
}
