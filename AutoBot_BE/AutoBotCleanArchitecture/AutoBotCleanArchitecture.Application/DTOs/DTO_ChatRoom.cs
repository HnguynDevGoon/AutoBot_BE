using System;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_ChatRoom
    {
        // 1. ID này quan trọng nhất:
        // - Nếu là User: Nó là UserId (Guid)
        // - Nếu là Guest: Nó là GuestSessionId (String)
        // -> FE sẽ dùng cái này truyền vào API GetHistory?TargetId=...
        public string Id { get; set; }

        // 2. Tên hiển thị (VD: "Nguyễn Văn A" hoặc "Khách vãng lai...")
        public string Name { get; set; }

        // 3. Ảnh đại diện
        public string Avatar { get; set; }

        // 4. Tin nhắn cuối cùng (để hiện preview mờ mờ dưới tên)
        public string LastMessage { get; set; }

        // 5. Thời gian nhắn tin cuối (để sắp xếp ai mới nhắn thì lên đầu)
        public DateTime LastMessageTime { get; set; }

        // 6. Số tin chưa đọc (để hiện cái cục đỏ đỏ báo hiệu)
        public int UnreadCount { get; set; }

        public Guid roomId { get; set; }

        // 7. Cờ đánh dấu khách (để FE có thể hiện label "Khách" nếu muốn)
        public bool IsGuest { get; set; }
        // --- THÊM 2 TRƯỜNG NÀY ---
        public bool isAdminSeen { get; set; }
        public bool isUserSeen { get; set; }
        public bool IsAdminLastSender { get; set; }
        public Guid? UserId { get; set; }
        public string? GuestId { get; set; }
    }
}