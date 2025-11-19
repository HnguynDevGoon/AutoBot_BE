using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class Wallet : BaseEntity
    {
        public double Balance { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; }
        public ICollection<WalletTransaction> WalletTransactions { get; set; }
    }
}
