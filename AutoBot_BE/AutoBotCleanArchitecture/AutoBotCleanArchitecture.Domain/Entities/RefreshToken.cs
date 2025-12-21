using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class RefreshToken : BaseEntity
    {
        public string Token { get; set; }
        public Guid UserId { get; set; }
        public DateTime Exprited { get; set; }
        public User? User { get; set; }
    }
}
