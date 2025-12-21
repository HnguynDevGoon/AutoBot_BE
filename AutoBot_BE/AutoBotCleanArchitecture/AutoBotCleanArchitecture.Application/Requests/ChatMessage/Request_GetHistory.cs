using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ChatMessage
{
    public class Request_GetHistory
    {
        public string? TargetId { get; set; }
        public string? GuestId { get; set; }

        [JsonIgnore]
        public string? CurrentUserId { get; set; }

        [JsonIgnore]
        public string? CurrentIp { get; set; }

        [JsonIgnore]
        public string? Role { get; set; }
    }
}
