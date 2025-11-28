using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ChatMessage
{
    public class Request_SendMessage
    {
        public string Message { get; set; }
        public string? TargetId { get; set; }
        // --- THÊM: Mã định danh khách (FE tự sinh và gửi lên) ---
        public string? GuestId { get; set; }
        public string TypeMessage { get; set; } = "Text"; // Frontend gửi: "Image", "File"...
        // --- THÔNG TIN CONTEXT (Controller sẽ điền vào) ---
        [JsonIgnore] // Ẩn khỏi Swagger để FE không cần điền (và không thấy)
        public string? CurrentUserId { get; set; }

        [JsonIgnore]
        public string? CurrentIp { get; set; }

        [JsonIgnore]
        public string? Role { get; set; }
    }
}
