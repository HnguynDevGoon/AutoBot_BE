using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class WithdrawMoney : BaseEntity
    {
        // Tên ngân hàng
        public string? BankName { get; set; }

        // Số tiền rút - NÊN DÙNG decimal (để không lỗi làm tròn)
        public double BankAmount { get; set; }

        // Số tài khoản ngân hàng
        public string? BankCode { get; set; }

        // Tên chủ tài khoản
        public string? UserBankName { get; set; }

        // QR Code (chuỗi lưu base64 hoặc URL)
        public string? QrCode { get; set; }

        // Ngày gửi yêu cầu rút tiền
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Trạng thái rút tiền: Pending / Success / Reject
        public string Status { get; set; } = "Đang chờ";

        // Ghi chú admin (tùy chọn)
        public string? Note { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
    }
}
