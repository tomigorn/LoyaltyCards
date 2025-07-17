using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyaltyCards.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEncryptionAndCardEncryption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CardNonce",
                table: "LoyaltyCards",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CardTag",
                table: "LoyaltyCards",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PinNonce",
                table: "LoyaltyCards",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PinTag",
                table: "LoyaltyCards",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserEncryptionKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AppUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Salt = table.Column<byte[]>(type: "BLOB", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserEncryptionKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserEncryptionKeys_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserEncryptionKeys_AppUserId",
                table: "UserEncryptionKeys",
                column: "AppUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserEncryptionKeys");

            migrationBuilder.DropColumn(
                name: "CardNonce",
                table: "LoyaltyCards");

            migrationBuilder.DropColumn(
                name: "CardTag",
                table: "LoyaltyCards");

            migrationBuilder.DropColumn(
                name: "PinNonce",
                table: "LoyaltyCards");

            migrationBuilder.DropColumn(
                name: "PinTag",
                table: "LoyaltyCards");
        }
    }
}
