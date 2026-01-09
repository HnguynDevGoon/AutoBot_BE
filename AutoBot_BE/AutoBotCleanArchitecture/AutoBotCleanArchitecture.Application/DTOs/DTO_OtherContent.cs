using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_OtherContent
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string OtherType { get; set; }
        public string Icon { get; set; }
    }
}
