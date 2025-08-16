using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WayCombat.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "ContraseñaHash", "Email", "FechaActualizacion", "FechaCreacion", "Nombre", "Rol" },
                values: new object[] { 1, "$2a$11$QLnwMTaIW7UfF2KJSm8TYeFrcqaRdt51Bh/mwFMPeUFH84SHU8SqK", "admin@waycombat.com", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrador", "Admin" });
        }
    }
}
