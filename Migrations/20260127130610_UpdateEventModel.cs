using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eventer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEventModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Events",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "FohTower",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AddBallast",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "CatwalkDepth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "CatwalkType",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnvMode",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FloorType",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FohDepth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "FohType",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FohWidth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeFoh",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeRoof",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "LayherRoofHeight",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "LayherRoofSlope",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "LayherScrim",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ProlyteScrim",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProlyteVariant",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RiserCount",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "RiserDepth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "RiserSide",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "RiserWidth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "RoofClearance",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "RoofType",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowMausery",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddBallast",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "CatwalkDepth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "CatwalkType",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "EnvMode",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FloorType",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohDepth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohType",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohWidth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IncludeFoh",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IncludeRoof",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "LayherRoofHeight",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "LayherRoofSlope",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "LayherScrim",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ProlyteScrim",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ProlyteVariant",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RiserCount",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RiserDepth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RiserSide",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RiserWidth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RoofClearance",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RoofType",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ShowMausery",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Events",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "FohTower",
                table: "Events",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "INTEGER");
        }
    }
}
