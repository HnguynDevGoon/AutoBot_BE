using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.UserBot
{
    public class Request_AddUserBot
    {
        public Guid UserId { get; set; }
        public Guid BotTradingId { get; set; }
    }
}
