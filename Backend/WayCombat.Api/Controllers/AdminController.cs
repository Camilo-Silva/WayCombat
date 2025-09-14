using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WayCombat.Api.DTOs;
using WayCombat.Api.Services;

namespace WayCombat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IMixService _mixService;

        public AdminController(IUsuarioService usuarioService, IMixService mixService)
        {
            _usuarioService = usuarioService;
            _mixService = mixService;
        }

        #region Gestión de Usuarios

        [HttpGet("usuarios")]
        public async Task<ActionResult<List<UsuarioDto>>> GetAllUsuarios()
        {
            try
            {
                var usuarios = await _usuarioService.GetAllAsync();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpGet("usuarios/{id}")]
        public async Task<ActionResult<UsuarioDto>> GetUsuario(int id)
        {
            try
            {
                var usuario = await _usuarioService.GetByIdAsync(id);
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

        [HttpPut("usuario/{userId}/acceso-mix/{mixId}")]
        public async Task<ActionResult> GrantOrRevokeAccess(int userId, int mixId, [FromBody] CreateAccesoMixDto accesoDto)
        {
            try
            {
                accesoDto.UsuarioId = userId;
                accesoDto.MixId = mixId;

                var result = await _mixService.GrantAccessAsync(accesoDto);
                if (!result)
                {
                    return BadRequest(new { message = "Error al otorgar acceso" });
                }

                return Ok(new { message = "Acceso otorgado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpDelete("usuario/{userId}/acceso-mix/{mixId}")]
        public async Task<ActionResult> RevokeAccess(int userId, int mixId)
        {
            try
            {
                var result = await _mixService.RevokeAccessAsync(userId, mixId);
                if (!result)
                {
                    return BadRequest(new { message = "Error al revocar acceso" });
                }

                return Ok(new { message = "Acceso revocado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpDelete("usuarios/{id}")]
        public async Task<ActionResult> DeleteUsuario(int id)
        {
            try
            {
                // Verificar que no sea el último administrador
                var usuarios = await _usuarioService.GetAllAsync();
                var admins = usuarios.Where(u => u.Rol == "admin").ToList();
                var usuarioAEliminar = usuarios.FirstOrDefault(u => u.Id == id);

                if (usuarioAEliminar == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                if (usuarioAEliminar.Rol == "admin" && admins.Count <= 1)
                {
                    return BadRequest(new { message = "No se puede eliminar el último administrador del sistema" });
                }

                var result = await _usuarioService.DeleteAsync(id);
                if (!result)
                {
                    return BadRequest(new { message = "Error al eliminar usuario" });
                }

                return Ok(new { message = "Usuario eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPatch("usuarios/{id}/toggle-activo")]
        public async Task<ActionResult<UsuarioDto>> ToggleUsuarioActivo(int id)
        {
            try
            {
                var usuario = await _usuarioService.GetByIdAsync(id);
                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // No permitir desactivar administradores
                if (usuario.Rol == "admin")
                {
                    return BadRequest(new { message = "No se puede desactivar usuarios administradores" });
                }

                var result = await _usuarioService.ToggleActivoAsync(id);
                if (result == null)
                {
                    return BadRequest(new { message = "Error al cambiar estado del usuario" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPatch("usuarios/{id}/reset-password")]
        public async Task<ActionResult> ResetUserPassword(int id)
        {
            try
            {
                var usuario = await _usuarioService.GetByIdAsync(id);
                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // No permitir resetear contraseña de administradores
                if (usuario.Rol == "admin")
                {
                    return BadRequest(new { message = "No se puede resetear contraseña de usuarios administradores" });
                }

                var result = await _usuarioService.ResetPasswordAsync(id);
                if (!result)
                {
                    return BadRequest(new { message = "Error al resetear contraseña del usuario" });
                }

                return Ok(new { message = "Contraseña reseteada exitosamente a '123456'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        #endregion

        #region Gestión de Mixes

        [HttpGet("mixs")]
        public async Task<ActionResult<List<MixDto>>> GetAllMixs()
        {
            try
            {
                var mixs = await _mixService.GetAllForAdminAsync();
                return Ok(mixs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("mixs")]
        public async Task<ActionResult<MixDto>> CreateMix(CreateMixDto createMixDto)
        {
            try
            {
                var mix = await _mixService.CreateAsync(createMixDto);
                
                // Obtener el ID del usuario admin actual
                var userIdClaim = User.FindFirst("userId");
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int adminUserId))
                {
                    // Asignar automáticamente acceso al admin que creó el mix
                    var createAccesoRequest = new CreateAccesoMixRequest
                    {
                        UsuarioId = adminUserId,
                        MixId = mix.Id
                    };
                    
                    await _mixService.CreateAccesoAsync(createAccesoRequest);
                }
                
                return CreatedAtAction(nameof(GetMix), new { id = mix.Id }, mix);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpGet("mixs/{id}")]
        public async Task<ActionResult<MixDto>> GetMix(int id)
        {
            try
            {
                var mix = await _mixService.GetByIdAsync(id);
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

        [HttpPut("mixs/{id}")]
        public async Task<ActionResult> UpdateMix(int id, UpdateMixDto updateMixDto)
        {
            try
            {
                var result = await _mixService.UpdateAsync(id, updateMixDto);
                if (!result)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                return Ok(new { message = "Mix actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPatch("mixs/{id}/toggle-activo")]
        public async Task<ActionResult> ToggleMixActivo(int id)
        {
            try
            {
                var result = await _mixService.ToggleActivoAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                return Ok(new { message = "Estado del mix actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpDelete("mixs/{id}")]
        public async Task<ActionResult> DeleteMix(int id)
        {
            try
            {
                var result = await _mixService.DeleteAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Mix no encontrado" });
                }

                return Ok(new { message = "Mix eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("mixs/{mixId}/archivos")]
        public async Task<ActionResult<ArchivoMixDto>> AddArchivo(int mixId, CreateArchivoMixDto createArchivoDto)
        {
            try
            {
                var archivo = await _mixService.AddArchivoAsync(mixId, createArchivoDto);
                return CreatedAtAction(nameof(GetMix), new { id = mixId }, archivo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpDelete("mixs/{mixId}/archivos/{archivoId}")]
        public async Task<ActionResult> DeleteArchivo(int mixId, int archivoId)
        {
            try
            {
                var result = await _mixService.DeleteArchivoAsync(archivoId);
                if (!result)
                {
                    return NotFound(new { message = "Archivo no encontrado" });
                }

                return Ok(new { message = "Archivo eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpGet("accesos")]
        public async Task<ActionResult<List<AccesoMixDto>>> GetAccesos()
        {
            try
            {
                var accesos = await _mixService.GetAccesosAsync();
                return Ok(accesos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("accesos")]
        public async Task<ActionResult> CreateAcceso([FromBody] CreateAccesoMixRequest request)
        {
            try
            {
                await _mixService.CreateAccesoAsync(request);
                return Ok(new { message = "Acceso creado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("accesos/toggle")]
        public async Task<ActionResult> ToggleAcceso([FromBody] ToggleAccesoRequest request)
        {
            try
            {
                await _mixService.ToggleAccesoAsync(request.UsuarioId, request.MixId);
                return Ok(new { message = "Acceso actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpDelete("accesos/{usuarioId}/{mixId}")]
        public async Task<ActionResult> DeleteAcceso(int usuarioId, int mixId)
        {
            try
            {
                await _mixService.DeleteAccesoAsync(usuarioId, mixId);
                return Ok(new { message = "Acceso eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("fix-mix-access")]
        public async Task<ActionResult> FixMixAccess()
        {
            try
            {
                // Obtener usuario admin
                var adminUser = await _usuarioService.GetByEmailAsync("admin@waycombat.com");
                if (adminUser == null)
                {
                    return BadRequest(new { message = "Usuario admin no encontrado" });
                }

                // Crear accesos para Mixes 5 y 6
                var mixIds = new[] { 5, 6 };
                var results = new List<string>();

                foreach (var mixId in mixIds)
                {
                    try
                    {
                        var request = new CreateAccesoMixRequest
                        {
                            UsuarioId = adminUser.Id,
                            MixId = mixId
                        };
                        
                        await _mixService.CreateAccesoAsync(request);
                        results.Add($"Acceso creado para Mix {mixId}");
                    }
                    catch (Exception ex)
                    {
                        results.Add($"Error en Mix {mixId}: {ex.Message}");
                    }
                }

                return Ok(new { message = "Proceso completado", results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        #endregion
    }
}
