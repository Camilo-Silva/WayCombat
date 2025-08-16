using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WayCombat.Api.DTOs;
using WayCombat.Api.Services;

namespace WayCombat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuarioController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet("mi-cuenta")]
        public async Task<ActionResult<UsuarioDto>> GetMiCuenta()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var usuario = await _usuarioService.GetByIdAsync(currentUserId);

                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPut("cambiar-contraseña")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var result = await _usuarioService.ChangePasswordAsync(currentUserId, changePasswordDto);

                if (!result)
                {
                    return BadRequest(new { message = "Contraseña actual incorrecta" });
                }

                return Ok(new { message = "Contraseña actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPut("actualizar-perfil")]
        public async Task<ActionResult> UpdateProfile(UsuarioDto usuarioDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Solo permitir actualizar el propio perfil (excepto admins)
                if (currentUserId != usuarioDto.Id && currentUserRole != "Admin")
                {
                    return Forbid("No tienes permisos para actualizar este perfil");
                }

                // Los usuarios normales no pueden cambiar su rol
                if (currentUserRole != "Admin")
                {
                    var currentUser = await _usuarioService.GetByIdAsync(currentUserId);
                    if (currentUser != null)
                    {
                        usuarioDto.Rol = currentUser.Rol;
                    }
                }

                var result = await _usuarioService.UpdateAsync(usuarioDto.Id, usuarioDto);

                if (!result)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                return Ok(new { message = "Perfil actualizado exitosamente" });
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
