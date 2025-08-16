using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Data;
using WayCombat.Api.DTOs;
using WayCombat.Api.Models;

namespace WayCombat.Api.Services
{
    public interface IUsuarioService
    {
        Task<UsuarioDto?> GetByIdAsync(int id);
        Task<UsuarioDto?> GetByEmailAsync(string email);
        Task<List<UsuarioDto>> GetAllAsync();
        Task<UsuarioDto> CreateAsync(RegisterDto registerDto);
        Task<bool> UpdateAsync(int id, UsuarioDto usuarioDto);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
        Task<bool> DeleteAsync(int id);
        Task<bool> EmailExistsAsync(string email);
    }

    public class UsuarioService : IUsuarioService
    {
        private readonly WayCombatDbContext _context;

        public UsuarioService(WayCombatDbContext context)
        {
            _context = context;
        }

        public async Task<UsuarioDto?> GetByIdAsync(int id)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
                return null;

            return MapToDto(usuario);
        }

        public async Task<UsuarioDto?> GetByEmailAsync(string email)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == email);

            if (usuario == null)
                return null;

            return MapToDto(usuario);
        }

        public async Task<List<UsuarioDto>> GetAllAsync()
        {
            var usuarios = await _context.Usuarios
                .OrderBy(u => u.Nombre)
                .ToListAsync();

            return usuarios.Select(MapToDto).ToList();
        }

        public async Task<UsuarioDto> CreateAsync(RegisterDto registerDto)
        {
            var usuario = new Usuario
            {
                Nombre = registerDto.Nombre,
                Email = registerDto.Email.ToLower(),
                ContraseñaHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Contraseña),
                Rol = "Usuario",
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return MapToDto(usuario);
        }

        public async Task<bool> UpdateAsync(int id, UsuarioDto usuarioDto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return false;

            usuario.Nombre = usuarioDto.Nombre;
            usuario.Email = usuarioDto.Email.ToLower();
            usuario.Rol = usuarioDto.Rol;
            usuario.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return false;

            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.ContraseñaActual, usuario.ContraseñaHash))
                return false;

            usuario.ContraseñaHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NuevaContraseña);
            usuario.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return false;

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Usuarios
                .AnyAsync(u => u.Email == email.ToLower());
        }

        private static UsuarioDto MapToDto(Usuario usuario)
        {
            return new UsuarioDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Email = usuario.Email,
                Rol = usuario.Rol,
                FechaCreacion = usuario.FechaCreacion
            };
        }
    }
}
