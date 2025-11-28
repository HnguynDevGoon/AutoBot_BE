    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace AutoBotCleanArchitecture.Domain.Entities
    {
        public class ChatMessage : BaseEntity
        {
            // SỬA: Cho phép null (nếu là khách vãng lai)
            public Guid? SenderId { get; set; }
            public string Message { get; set; }
            public DateTime Timestamp { get; set; } = DateTime.UtcNow;
            public bool IsRead { get; set; } = false;
            public bool IsAdminSender { get; set; } // True: Admin, False: Khách
            public string IpAddress { get; set; } // --- THÊM: Lưu IP ---
            public string TypeMessage { get; set; } = "Text"; // Lưu: "Text", "Image", "Video", "File"
            public Guid ChatRoomId { get; set; }
            public ChatRoom ChatRoom { get; set; }


        }
    }
