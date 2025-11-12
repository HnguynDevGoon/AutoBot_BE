using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class PriceBot : BaseEntity
    {
        public int Month { get; set; }
        public double Price { get; set; }
        public int Discount { get; set; }
        public string DescriptionBot { get; set; }
        public Guid BotTradingId { get; set; }
        public BotTrading? BotTrading { get; set; }

    }
}
