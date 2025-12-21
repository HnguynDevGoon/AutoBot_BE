using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_WithdrawMoney
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }        // tên đăng nhập khách
        public string FullName { get; set; }        // họ tên khách
        public string Email { get; set; }           // email
        public string BankName { get; set; }        // tên ngân hàng
        public string BankCode { get; set; }        // số tài khoản
        public string UserBankName { get; set; }    // tên chủ tài khoản
        public string QrCode { get; set; }          // hình QR nếu có
        public double BankAmount { get; set; }     // số tiền rút
        public DateTime CreatedAt { get; set; }     // ngày yêu cầu
        public string Status { get; set; }          // trạng thái: Pending, Success, Failed
    }
}
