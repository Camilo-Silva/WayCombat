using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WayCombat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminUserWithFixedDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Mixes",
                columns: new[] { "Id", "Activo", "Descripcion", "FechaActualizacion", "FechaCreacion", "Titulo" },
                values: new object[,]
                {
                    { 1, true, "Rutinas fundamentales de Way Combat para principiantes", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Mix de Entrenamiento Básico" },
                    { 2, true, "Técnicas avanzadas y estrategias para competencias", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Mix Avanzado - Competencia" },
                    { 3, true, "Ejercicios de fortalecimiento y acondicionamiento físico", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Mix de Acondicionamiento" }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "ContraseñaHash", "Email", "FechaActualizacion", "FechaCreacion", "Nombre", "Rol" },
                values: new object[] { 1, "$2a$11$rYJrv8P5sVfGhD4F7.eOy.LdO8bPvF5D6qGh.Jz8Kf.7NmRx9P2JC", "admin@waycombat.com", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrador", "admin" });

            migrationBuilder.InsertData(
                table: "AccesoMixes",
                columns: new[] { "Id", "Activo", "FechaAcceso", "FechaExpiracion", "MixId", "UsuarioId" },
                values: new object[,]
                {
                    { 1, true, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 1, 1 },
                    { 2, true, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 2, 1 },
                    { 3, true, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 3, 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AccesoMixes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "AccesoMixes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "AccesoMixes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
