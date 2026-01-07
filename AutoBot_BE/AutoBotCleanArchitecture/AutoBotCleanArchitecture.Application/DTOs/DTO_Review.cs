using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_Review
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string UrlAvatar { get; set; }
        public int Rate { get; set; }
    }
}
