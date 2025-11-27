using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_Content
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string? UrlAvatar { get; set; }
        public string? Link { get; set; }
        public string Description { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
