using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eventer.Migrations
{
    /// <inheritdoc />
    public partial class AddNewFieldsToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Width",
                table: "Events",
                newName: "TowerHeight");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Events",
                newName: "WingType");

            migrationBuilder.RenameColumn(
                name: "Height",
                table: "Events",
                newName: "TowerDepth");

            migrationBuilder.RenameColumn(
                name: "Depth",
                table: "Events",
                newName: "StageWidth");

            migrationBuilder.AddColumn<double>(
                name: "Clearance",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "FohDist",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "FohLevel",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "FohScrim",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FohSize",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FohTower",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasScrim",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "StageDepth",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "StageHeight",
                table: "Events",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "TowerWidthBays",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WingDepthBays",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WingWidthBays",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Clearance",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohDist",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohLevel",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohScrim",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohSize",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FohTower",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "HasScrim",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "StageDepth",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "StageHeight",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TowerWidthBays",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "WingDepthBays",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "WingWidthBays",
                table: "Events");

            migrationBuilder.RenameColumn(
                name: "WingType",
                table: "Events",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "TowerHeight",
                table: "Events",
                newName: "Width");

            migrationBuilder.RenameColumn(
                name: "TowerDepth",
                table: "Events",
                newName: "Height");

            migrationBuilder.RenameColumn(
                name: "StageWidth",
                table: "Events",
                newName: "Depth");
        }
    }
}
