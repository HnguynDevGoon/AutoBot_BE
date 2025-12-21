using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_RevenueResponse
    {
        public double TotalRevenue { get; set; }
        public List<DTO_PurchaseHistory> Purchases { get; set; }
    }
}
