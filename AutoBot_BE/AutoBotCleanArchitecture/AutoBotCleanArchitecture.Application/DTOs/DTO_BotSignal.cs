using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_BotSignal
    {
        public Guid Id { get; set; }
        public DateTime DateTime { get; set; }
        public string Signal { get; set; }
        public double Price { get; set; }
    }
}
