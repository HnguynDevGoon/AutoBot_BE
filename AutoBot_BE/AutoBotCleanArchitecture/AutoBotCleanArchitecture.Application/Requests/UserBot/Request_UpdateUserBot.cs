using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.UserBot
{
    public class Request_UpdateUserBot
    {
        public Guid Id { get; set; } 
        public Guid UserId { get; set; }
        public Guid BotTradingId { get; set; }
        public DateTime ExpiredDate { get; set; }
    }
}
