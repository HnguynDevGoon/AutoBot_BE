using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.WalletTransaction
{
    public class Request_DeductMoney
    {
        public Guid UserId { get; set; }      
        public double Amount { get; set; }    
    }
}
