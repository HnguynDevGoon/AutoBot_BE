using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_VerifyTwoStep
    {
        public string Otp { get; set; }
        public string Fingerprint { get; set; }
    }
}
