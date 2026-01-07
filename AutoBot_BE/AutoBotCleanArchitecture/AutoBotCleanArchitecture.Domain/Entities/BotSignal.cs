using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class BotSignal : BaseEntity
    {
        public DateTime DateTime { get; set; }
        public string Signal { get; set; }
        public double Price { get; set; }
    }
}
