using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Wallet
{
    public class Request_CreatePinWallet
    {
        public Guid UserId { get; set; }
        public string Pin { get; set; }
        public string ConfirmPin { get; set; }
    }
}
