using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.AdminFile
{
    public class Request_AddSignal
    {
        public string Status { get; set; } = "";
        public double Price { get; set; }
        public int OrderNumber { get; set; }
        public double StopOrderValue { get; set; }
    }
}
