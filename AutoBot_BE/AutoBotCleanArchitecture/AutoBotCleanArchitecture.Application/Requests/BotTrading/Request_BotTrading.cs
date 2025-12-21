using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.BotTrading
{
    public class Request_BotTrading
    {
        public string NameBot { get; set; }
        public double InterestRate { get; set; } 
        public double TotalProfit { get; set; }
        public int CommandNumber { get; set; }
        public double WinRate { get; set; }
    }
}
