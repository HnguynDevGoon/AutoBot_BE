using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class ProfitLoss : BaseEntity
    {
        public double Price { get; set; }
        public DateTime Date { get; set; }
        public Guid? UserId { get; set; }
        public User? User { get; set; }
    }
}
