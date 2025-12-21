using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class BotTrading : BaseEntity
    {
        public string NameBot { get; set; }
        public double InterestRate { get; set; }
        public double TotalProfit { get; set; }
        public int CommandNumber { get; set; }
        public double WinRate { get; set; }
        public ICollection<PriceBot>? PriceBots { get; set; }
        public ICollection<UserBot> UsersBots { get; set; }
        public ICollection<PurchaseHistory> PurchaseHistories { get; set; }


    }
}
