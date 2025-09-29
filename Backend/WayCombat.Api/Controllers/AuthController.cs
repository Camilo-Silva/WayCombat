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
                Console.WriteLine($"Login attempt - Email: {loginDto.Email}, Password length: {loginDto.Contraseña?.Length}");
                
                // Buscar usuario
                var usuario = await _usuarioService.GetByEmailAsync(loginDto.Email);
                if (usuario == null)
                {
                    Console.WriteLine($"Usuario no encontrado para email: {loginDto.Email}");
                    return BadRequest(new { message = "Credenciales inválidas" });
                }

                Console.WriteLine($"Usuario encontrado - ID: {usuario.Id}, Email: {usuario.Email}, Activo: {usuario.Activo}");

                // Verificar si el usuario está activo
                if (!usuario.Activo)
                {
                    Console.WriteLine("Usuario inactivo");
                    return BadRequest(new { message = "Tu cuenta ha sido desactivada. Contacta al administrador." });
                }

                // Verificar contraseña (necesitamos obtener el hash desde la base de datos)
                var usuarioCompleto = await GetUsuarioCompletoAsync(loginDto.Email);
                if (usuarioCompleto == null)
                {
                    Console.WriteLine("Usuario completo no encontrado");
                    return BadRequest(new { message = "Credenciales inválidas" });
                }

                Console.WriteLine($"Hash almacenado: {usuarioCompleto.ContraseñaHash?.Substring(0, 20)}...");
                
                var passwordVerified = BCrypt.Net.BCrypt.Verify(loginDto.Contraseña, usuarioCompleto.ContraseñaHash);
                Console.WriteLine($"Password verification result: {passwordVerified}");
                
                if (!passwordVerified)
                {
                    Console.WriteLine("Contraseña incorrecta");
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

                Console.WriteLine("Login exitoso");
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

        [HttpGet("debug/users")]
        public async Task<ActionResult> GetUsers()
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<WayCombat.Api.Data.WayCombatDbContext>();
                var users = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(context.Usuarios);
                
                var userInfo = users.Select(u => new {
                    u.Id,
                    u.Email,
                    u.Nombre,
                    u.Rol,
                    u.Activo,
                    HashedPassword = u.ContraseñaHash?.Substring(0, 20) + "..." // Solo mostrar inicio del hash
                });
                
                return Ok(userInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error", error = ex.Message });
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
