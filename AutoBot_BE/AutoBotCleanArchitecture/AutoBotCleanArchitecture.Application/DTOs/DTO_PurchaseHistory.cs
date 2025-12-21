using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_PurchaseHistory
    {
        public Guid Id { get; set; }
        public double PriceBot { get; set; } 
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public DateTime Date { get; set; }

        public Guid UserId { get; set; }
        public string UserName { get; set; }
    }
}
