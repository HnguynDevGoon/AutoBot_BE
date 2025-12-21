using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.Device
{
    public class Request_LogoutAllDevices
    {
        public string accessToken { get; set; }
        public Guid UserId { get; set; }
    }
}