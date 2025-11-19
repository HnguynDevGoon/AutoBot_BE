using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    // SỬA 1: Bắt buộc kế thừa BaseEntity để có Id
    public class WalletTransaction : BaseEntity
    {
        // Số tiền giao dịch (dùng double theo ý ông)
        public double Amount { get; set; }

        // Loại giao dịch, ví dụ: "Deposit", "Purchase"
        public string TransactionType { get; set; }

        // Mô tả chi tiết, ví dụ: "Nạp tiền VNPay"
        public string Description { get; set; }

        // Thời điểm giao dịch xảy ra
        public DateTime Timestamp { get; set; }

        // Mã đơn hàng (để PayOS đối soát)
        public long OrderCode { get; set; }

        // Trạng thái giao dịch: "Pending", "Success", "Failed"
        // (Tên TransactionStatus của ông OK)
        public string TransactionStatus { get; set; }

        //------------------------------
        // SỬA 2: Bỏ dấu '?'
        // Một giao dịch BẮT BUỘC phải thuộc về 1 Wallet (Required)
        public Guid WalletId { get; set; }
        public Wallet Wallet { get; set; }
        //------------------------------
    }
}