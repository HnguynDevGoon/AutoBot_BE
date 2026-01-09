using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.BotTrading
{
    public class Request_SearchPriceBotByAdmin
    {
        public string? Keyword { get; set; }
        public bool? Price { get; set; }    
        public bool? Discount { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
