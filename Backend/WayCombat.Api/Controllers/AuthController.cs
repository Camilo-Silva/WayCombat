using Microsoft.AspNetCore.Mvc;
using WayCombat.Api.DTOs;
using WayCombat.Api.Services;

namespace WayCombat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly ITokenService _tokenService;

        public AuthController(IUsuarioService usuarioService, ITokenService tokenService)
        {
            _usuarioService = usuarioService;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                // Verificar si el email ya existe
                if (await _usuarioService.EmailExistsAsync(registerDto.Email))
                {
                    return BadRequest(new { message = "El email ya está registrado" });
                }

                // Crear usuario
                await _usuarioService.CreateAsync(registerDto);

                // Obtener el usuario completo para generar el token
                var usuario = await _usuarioService.GetByEmailAsync(registerDto.Email);
                if (usuario == null)
                {
                    return BadRequest(new { message = "Error al crear el usuario" });
                }

                // Generar token
                var usuarioParaToken = new WayCombat.Api.Models.Usuario
                {
                    Id = usuario.Id,
                    Nombre = usuario.Nombre,
                    Email = usuario.Email,
                    Rol = usuario.Rol
                };

                var token = _tokenService.GenerateToken(usuarioParaToken);

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = DateTime.UtcNow.AddHours(24),
                    Usuario = usuario
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                // Buscar usuario
                var usuario = await _usuarioService.GetByEmailAsync(loginDto.Email);
                if (usuario == null)
                {
                    return BadRequest(new { message = "Credenciales inválidas" });
                }

                // Verificar contraseña (necesitamos obtener el hash desde la base de datos)
                var usuarioCompleto = await GetUsuarioCompletoAsync(loginDto.Email);
                if (usuarioCompleto == null || !BCrypt.Net.BCrypt.Verify(loginDto.Contraseña, usuarioCompleto.ContraseñaHash))
                {
                    return BadRequest(new { message = "Credenciales inválidas" });
                }

                // Generar token
                var token = _tokenService.GenerateToken(usuarioCompleto);

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = DateTime.UtcNow.AddHours(24),
                    Usuario = usuario
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                var usuario = await _usuarioService.GetByEmailAsync(forgotPasswordDto.Email);
                if (usuario == null)
                {
                    // Por seguridad, siempre devolvemos éxito
                    return Ok(new { message = "Si el email existe, recibirás instrucciones para restablecer tu contraseña" });
                }

                // Implementar lógica de envío de email en el futuro
                // Por ahora solo retornamos un mensaje de éxito

                return Ok(new { message = "Si el email existe, recibirás instrucciones para restablecer tu contraseña" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor", error = ex.Message });
            }
        }

        private async Task<WayCombat.Api.Models.Usuario?> GetUsuarioCompletoAsync(string email)
        {
            // Este método debería implementarse en el servicio, pero por simplicidad lo hacemos aquí
            using var scope = HttpContext.RequestServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<WayCombat.Api.Data.WayCombatDbContext>();
            return await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                context.Usuarios, u => u.Email == email.ToLower());
        }
    }
}
