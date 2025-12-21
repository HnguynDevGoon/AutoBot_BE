using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_OnOffTwoStep
    {
        public Guid UserId { get; set; } 
        public bool IsTwoStep { get; set; }
    }
}
