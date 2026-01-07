using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ProfitLoss
{
    public class Request_CreateProfitLoss
    {
        public double Price { get; set; }
        public DateTime Date { get; set; }
        public Guid? UserId { get; set; }
    }
}