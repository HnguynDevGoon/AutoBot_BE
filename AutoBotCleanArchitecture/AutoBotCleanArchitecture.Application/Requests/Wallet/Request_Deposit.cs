using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Wallet
{
    public class Request_Deposit
    {
        public Guid UserId { get; set; }
        public int Amount { get; set; }
    }
}
