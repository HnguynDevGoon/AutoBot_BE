using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Role
{
    public class Request_UpdateRole
    {
        public Guid Id { get; set; }
        public string RoleName { get; set; }
    }
}
