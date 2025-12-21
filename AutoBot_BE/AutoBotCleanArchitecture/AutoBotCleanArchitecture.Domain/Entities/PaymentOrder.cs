using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class PaymentOrder: BaseEntity
    {
        public long OrderCode { get; set; }
        public int? DurationMonths { get; set; }
        public double Amount { get; set; }
        public string Status { get; set; }
        public string OrderType { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid? BotTradingId { get; set; }
        public BotTrading BotTrading { get; set; }
    }
}
