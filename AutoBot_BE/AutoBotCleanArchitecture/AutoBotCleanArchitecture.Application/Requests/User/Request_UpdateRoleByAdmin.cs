using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.User
{
    public class Request_UpdateRoleByAdmin
    {
        public Guid Id { get; set; }
        public string? RoleName { get; set; }
    }
}
