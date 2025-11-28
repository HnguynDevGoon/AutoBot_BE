using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_WalletTransaction
    {
        public Guid Id { get; set; }
        public double Amount { get; set; }
        public string TransactionType { get; set; }
        public string Description { get; set; }
        public DateTime Timestamp { get; set; }
        public long OrderCode { get; set; }
        public string TransactionStatus { get; set; }  // Trạng thái giao dịch: "Pending", "Success", "Failed"
        public Guid UserId { get; set; }
    }
}
