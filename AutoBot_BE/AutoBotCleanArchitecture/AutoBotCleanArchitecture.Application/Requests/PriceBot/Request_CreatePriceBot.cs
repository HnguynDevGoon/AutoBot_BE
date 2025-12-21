using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.PriceBot
{
    public class Request_CreatePriceBot
    {
        public int Month { get; set; }
        public double Price { get; set; }
        public int Discount { get; set; }
        public string Description { get; set; }
        public Guid BotTradingId { get; set; }

    }
}
