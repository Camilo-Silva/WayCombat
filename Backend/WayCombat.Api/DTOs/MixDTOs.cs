using System.ComponentModel.DataAnnotations;

namespace WayCombat.Api.DTOs
{
    public class MixDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public bool Activo { get; set; }
        public List<ArchivoMixDto> Archivos { get; set; } = new List<ArchivoMixDto>();
    }

    public class CreateMixDto
    {
        [Required(ErrorMessage = "El título es requerido")]
        [StringLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "La descripción no puede exceder los 1000 caracteres")]
        public string? Descripcion { get; set; }
    }

    public class UpdateMixDto
    {
        [Required(ErrorMessage = "El título es requerido")]
        [StringLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "La descripción no puede exceder los 1000 caracteres")]
        public string? Descripcion { get; set; }

        public bool Activo { get; set; }
    }

    public class ArchivoMixDto
    {
        public int Id { get; set; }
        public int MixId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string URL { get; set; } = string.Empty;
        public string? MimeType { get; set; }
        public long? TamañoBytes { get; set; }
        public int Orden { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
    }

    public class CreateArchivoMixDto
    {
        [Required(ErrorMessage = "El tipo de archivo es requerido")]
        public string Tipo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre del archivo es requerido")]
        [StringLength(200, ErrorMessage = "El nombre no puede exceder los 200 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "La URL es requerida")]
        [StringLength(500, ErrorMessage = "La URL no puede exceder los 500 caracteres")]
        public string URL { get; set; } = string.Empty;

        public string? MimeType { get; set; }
        public long? TamañoBytes { get; set; }
        public int Orden { get; set; } = 0;
    }

    public class AccesoMixDto
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int MixId { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string EmailUsuario { get; set; } = string.Empty;
        public string TituloMix { get; set; } = string.Empty;
        public DateTime FechaAcceso { get; set; }
        public DateTime? FechaExpiracion { get; set; }
        public bool Activo { get; set; }
    }

    public class CreateAccesoMixDto
    {
        [Required(ErrorMessage = "El ID del usuario es requerido")]
        public int UsuarioId { get; set; }

        [Required(ErrorMessage = "El ID del mix es requerido")]
        public int MixId { get; set; }

        public DateTime? FechaExpiracion { get; set; }
    }
}
