using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eventer.Migrations
{
    /// <inheritdoc />
    public partial class DodajTabeleRealizacji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Realizacje",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nazwa = table.Column<string>(type: "TEXT", nullable: false),
                    Data = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Opis = table.Column<string>(type: "TEXT", nullable: false),
                    MiniaturkaUrl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Realizacje", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZdjeciaRealizacji",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    RealizacjaId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZdjeciaRealizacji", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZdjeciaRealizacji_Realizacje_RealizacjaId",
                        column: x => x.RealizacjaId,
                        principalTable: "Realizacje",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ZdjeciaRealizacji_RealizacjaId",
                table: "ZdjeciaRealizacji",
                column: "RealizacjaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ZdjeciaRealizacji");

            migrationBuilder.DropTable(
                name: "Realizacje");
        }
    }
}
