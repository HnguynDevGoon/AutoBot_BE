using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_BotTrading
    {
        public Guid Id { get; set; }
        public string NameBot { get; set; }
        public double InterestRate { get; set; }
        public double TotalProfit { get; set; }
        public int CommandNumber { get; set; }
        public double WinRate { get; set; }
        public IList<DTO_PriceBots> PriceOptions { get; set; }
    }
}
