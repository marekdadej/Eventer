using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eventer.Migrations
{
    /// <inheritdoc />
    public partial class FinalnaStrukturaRealizacji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MiniaturkaUrl",
                table: "Realizacje",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MiniaturkaUrl",
                table: "Realizacje",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
