using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class Content : BaseEntity
    {
        public string Title { get; set; }
        public string? UrlAvatar { get; set; }
        public string? Link { get; set; }
        public string Description { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
