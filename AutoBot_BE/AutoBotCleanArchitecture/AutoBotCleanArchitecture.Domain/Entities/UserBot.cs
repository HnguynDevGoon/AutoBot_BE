using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class UserBot : BaseEntity
    {
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public Guid BotTradingId { get; set; }
        public BotTrading? BotTrading { get; set; }
        public DateTime ExpiredDate { get; set; }
    }
}
