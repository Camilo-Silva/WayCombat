using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WayCombat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTamañoBytesToMix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "TamañoBytes",
                table: "Mixes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 1,
                column: "TamañoBytes",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 2,
                column: "TamañoBytes",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mixes",
                keyColumn: "Id",
                keyValue: 3,
                column: "TamañoBytes",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TamañoBytes",
                table: "Mixes");
        }
    }
}
