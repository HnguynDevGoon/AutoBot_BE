using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.WalletTransaction
{
    public class Request_SearchTransaction
    {
        public string? Keyword { get; set; }       // Tìm theo: Mã đơn, Mô tả, Tên User
        public string? TransactionType { get; set; } // Tìm theo loại: "Nạp tiền", "Trừ tiền"...
        public string? Status { get; set; }        // Tìm theo trạng thái: "Thành công", "Thất bại"
        public DateTime? FromDate { get; set; }    // Từ ngày
        public DateTime? ToDate { get; set; }      // Đến ngày

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
