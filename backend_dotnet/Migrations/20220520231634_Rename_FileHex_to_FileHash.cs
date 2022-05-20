using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SU_COIN_BACK_END.Migrations
{
    public partial class Rename_FileHex_to_FileHash : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FileHex",
                table: "Projects",
                newName: "FileHash");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FileHash",
                table: "Projects",
                newName: "FileHex");
        }
    }
}
