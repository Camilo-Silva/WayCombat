using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WayCombat.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ContraseñaHash", "FechaActualizacion", "FechaCreacion" },
                values: new object[] { "$2a$11$QLnwMTaIW7UfF2KJSm8TYeFrcqaRdt51Bh/mwFMPeUFH84SHU8SqK", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ContraseñaHash", "FechaActualizacion", "FechaCreacion" },
                values: new object[] { "$2a$11$.7NfUDtWN6NoDn3rsINJMu/xS9H8WGR4qVdRlybzS/BpLvOoWvhFW", new DateTime(2025, 8, 12, 4, 42, 8, 220, DateTimeKind.Utc).AddTicks(3945), new DateTime(2025, 8, 12, 4, 42, 8, 220, DateTimeKind.Utc).AddTicks(3694) });
        }
    }
}
