using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_ChatMessage
    {
        public Guid Id { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsAdminSender { get; set; }
        public bool IsRead { get; set; }
        public string IpAddress { get; set; }
        public string TypeMessage { get; set; }

    }
}
