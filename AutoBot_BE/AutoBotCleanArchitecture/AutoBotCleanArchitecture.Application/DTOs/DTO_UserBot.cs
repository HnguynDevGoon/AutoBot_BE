using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_UserBot
    {
        public Guid? UserId { get; set; }
        public string UserName { get; set; }
        public Guid BotTradingId { get; set; } 
        public string BotName { get; set; }
    }
}
