using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_AdminDashboard
    {
        public List<DTO_User> Users { get; set; }
        public List<DTO_BotSignal> BotSignals { get; set; }
        public List<DTO_PurchaseHistory> PurchaseHistories { get; set; }
        public List<DTO_Content> Contents { get; set; }
        public List<DTO_OtherContent> OtherContents { get; set; }
        public List<DTO_Role> Roles { get; set; }
        public List<DTO_Expense> Expenses { get; set; }
        public List<DTO_ProfitLoss> ProfitLosses { get; set; }
    }
}
