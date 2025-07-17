using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyaltyCards.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEncryptionKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserEncryptionKeys_AppUserId",
                table: "UserEncryptionKeys");

            migrationBuilder.CreateIndex(
                name: "IX_UserEncryptionKeys_AppUserId",
                table: "UserEncryptionKeys",
                column: "AppUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserEncryptionKeys_AppUserId",
                table: "UserEncryptionKeys");

            migrationBuilder.CreateIndex(
                name: "IX_UserEncryptionKeys_AppUserId",
                table: "UserEncryptionKeys",
                column: "AppUserId");
        }
    }
}
