using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Wallet
    {
        // 1. Xem số dư và thông tin ví (Chỉ cần UserId là đủ)
        Task<ResponseObject<DTO_Wallet>> GetMoneyInWallet(Guid userId);

        // 2. Tạo ví mới (Dùng khi User mới đăng ký hoặc admin tạo thủ công)
        Task<ResponseObject<DTO_Wallet>> CreateWallet(Guid userId);
    }
}
