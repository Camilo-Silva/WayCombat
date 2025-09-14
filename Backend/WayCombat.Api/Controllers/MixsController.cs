using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WayCombat.Api.DTOs;
using WayCombat.Api.Services;

namespace WayCombat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MixsController : ControllerBase
    {
        private readonly IMixService _mixService;
        private readonly ILogger<MixsController> _logger;

        public MixsController(IMixService mixService, ILogger<MixsController> logger)
        {
            _mixService = mixService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<MixDto>>> GetMixes()
        {
            try
            {
                var mixes = await _mixService.GetAllAsync();
                return Ok(mixes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpGet("usuario/{userId}")]
        [Authorize]
        public async Task<ActionResult<List<MixDto>>> GetMixesByUsuario(int userId)
        {
            try
            {
                // Verificar que el usuario autenticado es el mismo o es admin
                var currentUserId = GetCurrentUserId();
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (currentUserId != userId && currentUserRole != "admin")
                {
                    return Forbid("No tienes permisos para acceder a esta información");
                }

                var mixes = await _mixService.GetMixesByUsuarioAsync(userId);
                return Ok(mixes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpGet("{mixId}")]
        [Authorize]
        public async Task<ActionResult<MixDto>> GetMix(int mixId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Los administradores pueden acceder a cualquier mix
                if (currentUserRole == "admin")
                {
                    var adminMix = await _mixService.GetByIdAsync(mixId);
                    if (adminMix == null)
                    {
                        return NotFound(new { message = "Mix no encontrado" });
                    }
                    return Ok(adminMix);
                }

                // Para usuarios normales, verificar acceso específico
                var mix = await _mixService.GetMixWithAccessCheckAsync(mixId, currentUserId);

                if (mix == null)
                {
                    return NotFound(new { message = "Mix no encontrado o sin acceso" });
                }

                return Ok(mix);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<MixDto>> CreateMix([FromBody] CreateMixDto createMixDto)
        {
            try
            {
                var mix = await _mixService.CreateAsync(createMixDto);
                return CreatedAtAction(nameof(GetMix), new { mixId = mix.Id }, mix);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creando mix", error = ex.Message });
            }
        }

        [HttpPut("{mixId}")]
        [Authorize]
        public async Task<ActionResult<MixDto>> UpdateMix(int mixId, [FromBody] UpdateMixDto updateMixDto)
        {
            try
            {
                _logger.LogInformation("[UpdateMix] Recibida petición para mix ID: {MixId}", mixId);
                _logger.LogInformation("[UpdateMix] Archivos recibidos: {ArchivoCount}", updateMixDto.Archivos?.Count ?? 0);
                
                var success = await _mixService.UpdateAsync(mixId, updateMixDto);
                if (!success)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                var updatedMix = await _mixService.GetByIdAsync(mixId);
                return Ok(updatedMix);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UpdateMix] Error actualizando mix {MixId}", mixId);
                return StatusCode(500, new { message = "Error actualizando mix", error = ex.Message });
            }
        }

        [HttpDelete("{mixId}")]
        [Authorize]
        public async Task<ActionResult> DeleteMix(int mixId)
        {
            try
            {
                var success = await _mixService.DeleteAsync(mixId);
                if (!success)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error eliminando mix", error = ex.Message });
            }
        }

        [HttpPost("{mixId}/archivos")]
        [AllowAnonymous] // Temporalmente público para pruebas
        public async Task<ActionResult<ArchivoMixDto>> AddArchivo(int mixId, [FromBody] CreateArchivoMixDto createArchivoDto)
        {
            try
            {
                var archivo = await _mixService.AddArchivoAsync(mixId, createArchivoDto);
                return Ok(archivo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error agregando archivo", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }
    }
}
