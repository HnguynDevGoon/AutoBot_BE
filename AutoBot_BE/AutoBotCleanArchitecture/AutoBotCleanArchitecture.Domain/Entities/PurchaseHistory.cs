using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class PurchaseHistory : BaseEntity
    {
        public double PriceBot { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public DateTime Date { get; set; }
        public long OrderCode { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid? BotTradingId { get; set; }
        public BotTrading? BotTrading { get; set; }
        public Guid? WalletId { get; set; }
        public Wallet? Wallet { get; set; }
    }
}
