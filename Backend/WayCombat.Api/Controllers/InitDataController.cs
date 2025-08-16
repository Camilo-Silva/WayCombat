using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Data;
using WayCombat.Api.Models;

namespace WayCombat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InitDataController : ControllerBase
    {
        private readonly WayCombatDbContext _context;

        public InitDataController(WayCombatDbContext context)
        {
            _context = context;
        }

        [HttpPost("create-test-mix")]
        public async Task<ActionResult> CreateTestMix()
        {
            try
            {
                // Verificar si ya existe un mix con este título
                var existingMix = await _context.Mixes
                    .FirstOrDefaultAsync(m => m.Titulo == "MIX 1 - Test Real");

                if (existingMix != null)
                {
                    return BadRequest(new { message = "Ya existe un mix con este título" });
                }

                // Crear el mix principal
                var mix = new Mix
                {
                    Titulo = "MIX 1 - Test Real",
                    Descripcion = "Mix de prueba con archivos reales de Google Drive y YouTube Music",
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow,
                    Activo = true
                };

                _context.Mixes.Add(mix);
                await _context.SaveChangesAsync();

                // Crear los archivos del mix
                var archivos = new List<ArchivoMix>
                {
                    // Audio MP3
                    new ArchivoMix
                    {
                        MixId = mix.Id,
                        Tipo = "Audio",
                        Nombre = "track1.mp3",
                        URL = "https://drive.google.com/file/d/1HmRJahcntpMR_HPTQW6uXphWQ6nNVaM_/view?usp=drive_link",
                        MimeType = "audio/mpeg",
                        TamañoBytes = 8388608, // 8MB aproximado
                        Orden = 1,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow,
                        Activo = true
                    },
                    // Video MP4
                    new ArchivoMix
                    {
                        MixId = mix.Id,
                        Tipo = "Video",
                        Nombre = "track1.mp4",
                        URL = "https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link",
                        MimeType = "video/mp4",
                        TamañoBytes = 104857600, // 100MB aproximado
                        Orden = 2,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow,
                        Activo = true
                    },
                    // Video MP4
                    new ArchivoMix
                    {
                        MixId = mix.Id,
                        Tipo = "Video",
                        Nombre = "Way_Combat_Video.mp4",
                        URL = "https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link",
                        MimeType = "video/mp4",
                        TamañoBytes = 104857600,
                        Orden = 3,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow,
                        Activo = true
                    }
                };

                _context.ArchivoMixes.AddRange(archivos);
                await _context.SaveChangesAsync();

                // Dar acceso al usuario admin (ID 1)
                var accesoMix = new AccesoMix
                {
                    UsuarioId = 1, // Admin user
                    MixId = mix.Id,
                    FechaAcceso = DateTime.UtcNow,
                    Activo = true
                };

                _context.AccesoMixes.Add(accesoMix);
                await _context.SaveChangesAsync();

                // Retornar el mix creado con sus archivos
                var mixCreado = await _context.Mixes
                    .Include(m => m.ArchivoMixes)
                    .Where(m => m.Id == mix.Id)
                    .Select(m => new
                    {
                        m.Id,
                        m.Titulo,
                        m.Descripcion,
                        m.FechaCreacion,
                        Archivos = m.ArchivoMixes.Select(a => new
                        {
                            a.Id,
                            a.Nombre,
                            a.Tipo,
                            a.URL,
                            a.MimeType,
                            a.Orden
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                return Ok(new 
                { 
                    message = "Mix de prueba creado exitosamente",
                    mix = mixCreado
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear el mix de prueba", error = ex.Message });
            }
        }

        [HttpDelete("delete-youtube-file")]
        public async Task<ActionResult> DeleteYouTubeFile()
        {
            try
            {
                var youtubeFile = await _context.ArchivoMixes
                    .FirstOrDefaultAsync(a => a.Nombre.Contains("YouTube") || a.MimeType == "video/youtube" || a.Nombre.Contains("Way_Combat_Video"));

                if (youtubeFile != null)
                {
                    _context.ArchivoMixes.Remove(youtubeFile);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Archivo de YouTube eliminado exitosamente" });
                }

                return NotFound(new { message = "No se encontró archivo de YouTube para eliminar" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar archivo", error = ex.Message });
            }
        }

        [HttpPut("update-youtube-to-mp4")]
        public async Task<ActionResult> UpdateYouTubeToMp4()
        {
            try
            {
                var youtubeFile = await _context.ArchivoMixes
                    .FirstOrDefaultAsync(a => a.MimeType == "video/youtube");

                if (youtubeFile != null)
                {
                    youtubeFile.Nombre = "Way_Combat_Video.mp4";
                    youtubeFile.URL = "https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link";
                    youtubeFile.MimeType = "video/mp4";
                    youtubeFile.TamañoBytes = 104857600;
                    youtubeFile.FechaActualizacion = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Archivo de YouTube actualizado a MP4 exitosamente" });
                }

                return NotFound(new { message = "No se encontró archivo de YouTube para actualizar" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar archivo", error = ex.Message });
            }
        }

        [HttpDelete("delete-test-mix")]
        public async Task<ActionResult> DeleteTestMix()
        {
            try
            {
                var existingMix = await _context.Mixes
                    .Include(m => m.ArchivoMixes)
                    .Include(m => m.AccesoMixes)
                    .FirstOrDefaultAsync(m => m.Titulo == "MIX 1 - Test Real");

                if (existingMix != null)
                {
                    // Eliminar accesos
                    _context.AccesoMixes.RemoveRange(existingMix.AccesoMixes);
                    
                    // Eliminar archivos
                    _context.ArchivoMixes.RemoveRange(existingMix.ArchivoMixes);
                    
                    // Eliminar mix
                    _context.Mixes.Remove(existingMix);
                    
                    await _context.SaveChangesAsync();
                    
                    return Ok(new { message = "Mix de prueba eliminado exitosamente" });
                }
                
                return NotFound(new { message = "No se encontró el mix de prueba" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar el mix de prueba", error = ex.Message });
            }
        }

        [HttpGet("test-data")]
        public async Task<ActionResult> GetTestData()
        {
            try
            {
                var mixes = await _context.Mixes
                    .Include(m => m.ArchivoMixes)
                    .Where(m => m.Activo)
                    .Select(m => new
                    {
                        m.Id,
                        m.Titulo,
                        m.Descripcion,
                        m.FechaCreacion,
                        TotalArchivos = m.ArchivoMixes.Count(a => a.Activo),
                        Archivos = m.ArchivoMixes.Where(a => a.Activo).Select(a => new
                        {
                            a.Id,
                            a.Nombre,
                            a.Tipo,
                            a.MimeType,
                            a.Orden
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { mixes, totalMixes = mixes.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener datos de prueba", error = ex.Message });
            }
        }
    }
}
