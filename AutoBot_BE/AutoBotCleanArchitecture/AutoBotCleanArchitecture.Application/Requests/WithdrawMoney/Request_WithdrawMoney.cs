using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.WithdrawMoney
{
    public class Request_WithdrawMoney
    {
        public string BankName { get; set; }
        public double BankAmount { get; set; }
        public string BankCode { get; set; }
        public string UserBankName { get; set; }
        public string  QrCode { get; set; }
        public string Note { get; set; }
        public Guid UserId { get; set; }
    }
}
