using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class ChatRoom : BaseEntity
    {
        // SỬA: Cho phép null
        public Guid? UserId { get; set; }
        public User? User { get; set; }

        // --- THÊM: Định danh khách vãng lai bằng IP hoặc Session ---
        public string? GuestSessionId { get; set; } // Lưu IP hoặc chuỗi định danh khách

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ChatMessage> Messages { get; set; }
    }
}
