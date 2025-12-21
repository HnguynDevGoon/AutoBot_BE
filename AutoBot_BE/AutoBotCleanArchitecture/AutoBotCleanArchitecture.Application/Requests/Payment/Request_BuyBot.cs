using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Payment
{
    public class Request_BuyBot
    {
        public Guid UserId { get; set; }
        public Guid BotTradingId { get; set; }
        public Guid PriceBotId { get; set; } 
    }
}
