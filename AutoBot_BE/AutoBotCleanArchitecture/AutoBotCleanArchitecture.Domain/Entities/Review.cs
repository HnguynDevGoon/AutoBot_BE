using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class Review : BaseEntity
    {
        public string UrlAvatar { get; set; }
        public string FullName { get; set; }
        public int Rate { get; set; }
        public string Description { get; set; }
    }
}
