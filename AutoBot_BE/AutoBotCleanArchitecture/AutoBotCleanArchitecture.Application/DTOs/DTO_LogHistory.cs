using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_LogHistory
    {
        public Guid Id { get; set; }
        public string Signal { get; set; }
        public DateTime DateTime { get; set; }
        public bool IsSL { get; set; }
        public double ProfitPointTP { get; set; }
        public int NumberContract { get; set; }
        public double PriceBuy { get; set; }
        public Guid UserId { get; set; }
        public double Profit { get; set; }
        public string FullName { get; set; }
    }
}
