using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.BotTrading
{
    public class Request_SearchBotTradingByAdmin
    {
        public string? Keyword { get; set; } = "";
        public bool? InterestRate { get; set; } = null;
        public bool? TotalProfit { get; set; } = null;
        public bool? WinRate { get; set; } = null;
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
