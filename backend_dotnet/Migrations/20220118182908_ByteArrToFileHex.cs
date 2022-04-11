using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SU_COIN_BACK_END.Migrations
{
    public partial class ByteArrToFileHex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MyPDF",
                table: "Projects");

            migrationBuilder.AddColumn<string>(
                name: "FileHex",
                table: "Projects",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileHex",
                table: "Projects");

            migrationBuilder.AddColumn<byte[]>(
                name: "MyPDF",
                table: "Projects",
                type: "longblob",
                nullable: false);
        }
    }
}
