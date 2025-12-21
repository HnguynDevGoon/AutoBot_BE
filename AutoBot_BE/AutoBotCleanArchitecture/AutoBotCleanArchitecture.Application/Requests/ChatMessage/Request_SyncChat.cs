using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ChatMessage
{
    public class Request_SyncChat
    {
        public string GuestId { get; set; } // Mã khách cũ (từ LocalStorage)

        [JsonIgnore] // Ẩn trên Swagger vì cái này Backend tự lấy từ Token
        public Guid UserId { get; set; }
    }
}
