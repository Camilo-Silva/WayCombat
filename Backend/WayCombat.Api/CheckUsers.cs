using Microsoft.EntityFrameworkCore;
using WayCombat.Api.Data;

var optionsBuilder = new DbContextOptionsBuilder<WayCombatDbContext>();
optionsBuilder.UseSqlite("Data Source=waycombat_dev.db");

using var context = new WayCombatDbContext(optionsBuilder.Options);

var usuarios = await context.Usuarios.ToListAsync();

Console.WriteLine("Usuarios existentes en la base de datos:");
foreach (var usuario in usuarios)
{
    Console.WriteLine($"ID: {usuario.Id}, Email: {usuario.Email}, Nombre: {usuario.Nombre}");
}

Console.WriteLine($"\nTotal de usuarios: {usuarios.Count}");
