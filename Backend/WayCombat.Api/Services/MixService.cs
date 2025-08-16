using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Data;
using WayCombat.Api.DTOs;
using WayCombat.Api.Models;

namespace WayCombat.Api.Services
{
    public interface IMixService
    {
        Task<List<MixDto>> GetAllAsync();
        Task<List<MixDto>> GetMixesByUsuarioAsync(int usuarioId);
        Task<MixDto?> GetByIdAsync(int id);
        Task<MixDto?> GetMixWithAccessCheckAsync(int mixId, int usuarioId);
        Task<MixDto> CreateAsync(CreateMixDto createMixDto);
        Task<bool> UpdateAsync(int id, UpdateMixDto updateMixDto);
        Task<bool> DeleteAsync(int id);
        Task<ArchivoMixDto> AddArchivoAsync(int mixId, CreateArchivoMixDto createArchivoDto);
        Task<bool> DeleteArchivoAsync(int archivoId);
        Task<List<AccesoMixDto>> GetAccesosAsync();
        Task<bool> GrantAccessAsync(CreateAccesoMixDto createAccesoDto);
        Task<bool> RevokeAccessAsync(int usuarioId, int mixId);
        Task CreateAccesoAsync(CreateAccesoMixRequest request);
        Task ToggleAccesoAsync(int usuarioId, int mixId);
        Task DeleteAccesoAsync(int usuarioId, int mixId);
    }

    public class MixService : IMixService
    {
        private readonly WayCombatDbContext _context;

        public MixService(WayCombatDbContext context)
        {
            _context = context;
        }

        public async Task<List<MixDto>> GetAllAsync()
        {
            var mixes = await _context.Mixes
                .Include(m => m.ArchivoMixes.Where(a => a.Activo))
                .Where(m => m.Activo)
                .OrderByDescending(m => m.FechaCreacion)
                .ToListAsync();

            return mixes.Select(MapToDto).ToList();
        }

        public async Task<List<MixDto>> GetMixesByUsuarioAsync(int usuarioId)
        {
            var mixes = await _context.AccesoMixes
                .Include(am => am.Mix)
                    .ThenInclude(m => m.ArchivoMixes.Where(a => a.Activo))
                .Where(am => am.UsuarioId == usuarioId && am.Activo && am.Mix.Activo)
                .Where(am => am.FechaExpiracion == null || am.FechaExpiracion > DateTime.UtcNow)
                .Select(am => am.Mix)
                .OrderByDescending(m => m.FechaCreacion)
                .ToListAsync();

            return mixes.Select(MapToDto).ToList();
        }

        public async Task<MixDto?> GetByIdAsync(int id)
        {
            var mix = await _context.Mixes
                .Include(m => m.ArchivoMixes.Where(a => a.Activo))
                .FirstOrDefaultAsync(m => m.Id == id && m.Activo);

            if (mix == null)
                return null;

            return MapToDto(mix);
        }

        public async Task<MixDto?> GetMixWithAccessCheckAsync(int mixId, int usuarioId)
        {
            var hasAccess = await _context.AccesoMixes
                .AnyAsync(am => am.MixId == mixId && am.UsuarioId == usuarioId && am.Activo
                    && (am.FechaExpiracion == null || am.FechaExpiracion > DateTime.UtcNow));

            if (!hasAccess)
                return null;

            return await GetByIdAsync(mixId);
        }

        public async Task<MixDto> CreateAsync(CreateMixDto createMixDto)
        {
            var mix = new Mix
            {
                Titulo = createMixDto.Titulo,
                Descripcion = createMixDto.Descripcion,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow,
                Activo = true
            };

            _context.Mixes.Add(mix);
            await _context.SaveChangesAsync();

            return MapToDto(mix);
        }

        public async Task<bool> UpdateAsync(int id, UpdateMixDto updateMixDto)
        {
            var mix = await _context.Mixes.FindAsync(id);
            if (mix == null)
                return false;

            mix.Titulo = updateMixDto.Titulo;
            mix.Descripcion = updateMixDto.Descripcion;
            mix.Activo = updateMixDto.Activo;
            mix.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var mix = await _context.Mixes.FindAsync(id);
            if (mix == null)
                return false;

            mix.Activo = false;
            mix.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ArchivoMixDto> AddArchivoAsync(int mixId, CreateArchivoMixDto createArchivoDto)
        {
            var archivo = new ArchivoMix
            {
                MixId = mixId,
                Tipo = createArchivoDto.Tipo,
                Nombre = createArchivoDto.Nombre,
                URL = createArchivoDto.URL,
                MimeType = createArchivoDto.MimeType,
                TamañoBytes = createArchivoDto.TamañoBytes,
                Orden = createArchivoDto.Orden,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow,
                Activo = true
            };

            _context.ArchivoMixes.Add(archivo);
            await _context.SaveChangesAsync();

            return MapArchivoToDto(archivo);
        }

        public async Task<bool> DeleteArchivoAsync(int archivoId)
        {
            var archivo = await _context.ArchivoMixes.FindAsync(archivoId);
            if (archivo == null)
                return false;

            archivo.Activo = false;
            archivo.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AccesoMixDto>> GetAccesosAsync()
        {
            var accesos = await _context.AccesoMixes
                .Include(am => am.Usuario)
                .Include(am => am.Mix)
                .OrderByDescending(am => am.FechaAcceso)
                .ToListAsync();

            return accesos.Select(MapAccesoToDto).ToList();
        }

        public async Task<bool> GrantAccessAsync(CreateAccesoMixDto createAccesoDto)
        {
            var existingAccess = await _context.AccesoMixes
                .FirstOrDefaultAsync(am => am.UsuarioId == createAccesoDto.UsuarioId && am.MixId == createAccesoDto.MixId);

            if (existingAccess != null)
            {
                // Actualizar acceso existente
                existingAccess.Activo = true;
                existingAccess.FechaExpiracion = createAccesoDto.FechaExpiracion;
            }
            else
            {
                // Crear nuevo acceso
                var nuevoAcceso = new AccesoMix
                {
                    UsuarioId = createAccesoDto.UsuarioId,
                    MixId = createAccesoDto.MixId,
                    FechaAcceso = DateTime.UtcNow,
                    FechaExpiracion = createAccesoDto.FechaExpiracion,
                    Activo = true
                };

                _context.AccesoMixes.Add(nuevoAcceso);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RevokeAccessAsync(int usuarioId, int mixId)
        {
            var acceso = await _context.AccesoMixes
                .FirstOrDefaultAsync(am => am.UsuarioId == usuarioId && am.MixId == mixId);

            if (acceso == null)
                return false;

            acceso.Activo = false;
            await _context.SaveChangesAsync();
            return true;
        }

        private static MixDto MapToDto(Mix mix)
        {
            return new MixDto
            {
                Id = mix.Id,
                Titulo = mix.Titulo,
                Descripcion = mix.Descripcion,
                FechaCreacion = mix.FechaCreacion,
                Activo = mix.Activo,
                Archivos = mix.ArchivoMixes.Select(MapArchivoToDto).OrderBy(a => a.Orden).ToList()
            };
        }

        private static ArchivoMixDto MapArchivoToDto(ArchivoMix archivo)
        {
            return new ArchivoMixDto
            {
                Id = archivo.Id,
                MixId = archivo.MixId,
                Tipo = archivo.Tipo,
                Nombre = archivo.Nombre,
                URL = archivo.URL,
                MimeType = archivo.MimeType,
                TamañoBytes = archivo.TamañoBytes,
                Orden = archivo.Orden,
                Activo = archivo.Activo,
                FechaCreacion = archivo.FechaCreacion
            };
        }

        private static AccesoMixDto MapAccesoToDto(AccesoMix acceso)
        {
            return new AccesoMixDto
            {
                Id = acceso.Id,
                UsuarioId = acceso.UsuarioId,
                MixId = acceso.MixId,
                NombreUsuario = acceso.Usuario.Nombre,
                EmailUsuario = acceso.Usuario.Email,
                TituloMix = acceso.Mix.Titulo,
                FechaAcceso = acceso.FechaAcceso,
                FechaExpiracion = acceso.FechaExpiracion,
                Activo = acceso.Activo
            };
        }

        public async Task CreateAccesoAsync(CreateAccesoMixRequest request)
        {
            var existingAcceso = await _context.AccesoMixes
                .FirstOrDefaultAsync(a => a.UsuarioId == request.UsuarioId && a.MixId == request.MixId);

            if (existingAcceso != null)
            {
                // Si ya existe pero está inactivo, lo reactivamos
                if (!existingAcceso.Activo)
                {
                    existingAcceso.Activo = true;
                    existingAcceso.FechaAcceso = DateTime.UtcNow;
                    _context.AccesoMixes.Update(existingAcceso);
                }
            }
            else
            {
                // Crear nuevo acceso
                var nuevoAcceso = new AccesoMix
                {
                    UsuarioId = request.UsuarioId,
                    MixId = request.MixId,
                    FechaAcceso = DateTime.UtcNow,
                    Activo = true
                };
                _context.AccesoMixes.Add(nuevoAcceso);
            }

            await _context.SaveChangesAsync();
        }

        public async Task ToggleAccesoAsync(int usuarioId, int mixId)
        {
            var acceso = await _context.AccesoMixes
                .FirstOrDefaultAsync(a => a.UsuarioId == usuarioId && a.MixId == mixId);

            if (acceso != null)
            {
                // Si existe, cambiar su estado
                acceso.Activo = !acceso.Activo;
                if (acceso.Activo)
                {
                    acceso.FechaAcceso = DateTime.UtcNow;
                }
                _context.AccesoMixes.Update(acceso);
            }
            else
            {
                // Si no existe, crear nuevo acceso activo
                var nuevoAcceso = new AccesoMix
                {
                    UsuarioId = usuarioId,
                    MixId = mixId,
                    FechaAcceso = DateTime.UtcNow,
                    Activo = true
                };
                _context.AccesoMixes.Add(nuevoAcceso);
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAccesoAsync(int usuarioId, int mixId)
        {
            var acceso = await _context.AccesoMixes
                .FirstOrDefaultAsync(a => a.UsuarioId == usuarioId && a.MixId == mixId);

            if (acceso != null)
            {
                acceso.Activo = false;
                _context.AccesoMixes.Update(acceso);
                await _context.SaveChangesAsync();
            }
        }
    }
}
