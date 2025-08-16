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

        public MixsController(IMixService mixService)
        {
            _mixService = mixService;
        }

        [HttpGet]
        [AllowAnonymous] // Temporalmente público para pruebas
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

                if (currentUserId != userId && currentUserRole != "Admin")
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
        [AllowAnonymous] // Temporalmente público para pruebas
        public async Task<ActionResult<MixDto>> GetMix(int mixId)
        {
            try
            {
                // Temporalmente permitir acceso público para pruebas
                var mix = await _mixService.GetByIdAsync(mixId);

                if (mix == null)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                return Ok(mix);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }
    }
}
