using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_Wallet
    {
        public Guid Id { get; set;  }
        public double Balance { get; set; }
        public Guid UserId { get; set; }

    }
}
