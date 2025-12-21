using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class ConfirmEmail : BaseEntity
    {
        public string Code { get; set; }
        public string Message { get; set; }
        public DateTime Starttime { get; set; }
        public DateTime Expiredtime { get; set; }


        public Guid UserId { get; set; }
        public User? User { get; set; }
    }
}
