using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SU_COIN_BACK_END.Migrations
{
    public partial class Nonce : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Nonce",
                table: "Users",
                type: "int",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nonce",
                table: "Users");
        }
    }
}
