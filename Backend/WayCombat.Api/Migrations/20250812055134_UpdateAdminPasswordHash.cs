using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WayCombat.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "ContraseñaHash",
                value: "$2b$12$RUkztah0eZ97UsyYVqU9betRS67GhIqEGIWpuj41uiefD/rqIuIRm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "ContraseñaHash",
                value: "$2a$11$rYJrv8P5sVfGhD4F7.eOy.LdO8bPvF5D6qGh.Jz8Kf.7NmRx9P2JC");
        }
    }
}
