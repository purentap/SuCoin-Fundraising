using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SU_COIN_BACK_END.Migrations
{
    public partial class IsApproved_to_IsAuctionStarted : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsApproved",
                table: "Projects",
                newName: "IsAuctionStarted");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Projects",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsAuctionStarted",
                table: "Projects",
                newName: "IsApproved");

            migrationBuilder.UpdateData(
                table: "Projects",
                keyColumn: "ImageUrl",
                keyValue: null,
                column: "ImageUrl",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Projects",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
