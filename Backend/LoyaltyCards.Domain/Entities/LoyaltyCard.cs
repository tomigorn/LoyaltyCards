using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyaltyCards.Domain.Entities
{
    public class LoyaltyCard
    {
        [Key]
        public Guid Id { get; set; }
        public string Nickname { get; set; }
        public string StoreName { get; set; }
        public string BarcodeNumber { get; set; }
        public DateTime CreationDate { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}