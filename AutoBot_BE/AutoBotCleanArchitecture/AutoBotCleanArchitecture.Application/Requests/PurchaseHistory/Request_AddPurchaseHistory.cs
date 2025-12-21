using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.PurchaseHistory
{
    public class Request_AddPurchaseHistory
    {
        public Guid UserId { get; set; }
        public double PriceBot { get; set; } 
        public int DurationDays { get; set; }
        public string PaymentMethod { get; set; }
    }
}
