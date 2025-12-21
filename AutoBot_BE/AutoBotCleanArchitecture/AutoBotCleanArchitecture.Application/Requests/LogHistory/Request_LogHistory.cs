using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.LogHistory
{
    public class Request_LogHistory
    {
        public string Signal { get; set; }
        public double ProfitPointTP { get; set; }
        public double PriceBuy { get; set; }
        public int NumberContract { get; set; }
        public bool IsSL { get; set; }
        public DateTime DateTime { get; set; }
        public Guid? UserId { get; set; }
    }
}
