using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SU_COIN_BACK_END.Migrations
{
    public partial class Remove_TxnId_SunetId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SUNET_ID",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TxnID",
                table: "Projects");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SUNET_ID",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TxnID",
                table: "Projects",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
