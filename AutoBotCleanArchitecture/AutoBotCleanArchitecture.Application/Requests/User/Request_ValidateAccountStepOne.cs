using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_ValidateAccountStepOne
    {
        public string UserName { get; set; }
        public string Email { get; set; }
    }
}
