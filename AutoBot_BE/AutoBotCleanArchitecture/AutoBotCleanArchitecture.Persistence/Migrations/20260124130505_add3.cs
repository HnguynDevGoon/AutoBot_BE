using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoBotCleanArchitecture.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class add3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("7b26185e-e90d-4ea6-bea8-5562ad4f627c"),
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 13, 5, 3, 140, DateTimeKind.Utc).AddTicks(9929));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("7b26185e-e90d-4ea6-bea8-5562ad4f627c"),
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 8, 28, 15, 231, DateTimeKind.Utc).AddTicks(6663));
        }
    }
}
