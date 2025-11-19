using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Wallet : IService_Wallet
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_Wallet> responseObject;
        private readonly Converter_Wallet converter_Wallet; 

        public Service_Wallet(
            AppDbContext dbContext,
            ResponseBase responseBase,
            ResponseObject<DTO_Wallet> responseObject,
            Converter_Wallet converter_Wallet)
        {
            this.dbContext = dbContext;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.converter_Wallet = converter_Wallet;
        }

        // 1. TẠO VÍ MỚI
        public async Task<ResponseObject<DTO_Wallet>> CreateWallet(Guid userId)
        {
            try
            {
                var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == userId);
                if (user == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "User không tồn tại.", null);
                }

                var existingWallet = await dbContext.wallets.FirstOrDefaultAsync(x => x.UserId == userId);
                if (existingWallet != null)
                {
                    var dto = converter_Wallet.EntityToDTO(existingWallet);
                    return responseObject.responseObjectSuccess("User này đã có ví.", dto);
                }

                var newWallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Balance = 0, 
                };

                await dbContext.wallets.AddAsync(newWallet);
                await dbContext.SaveChangesAsync();

                newWallet.User = user;

                var walletDto = converter_Wallet.EntityToDTO(newWallet);
                return responseObject.responseObjectSuccess("Tạo ví thành công.", walletDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Server: " + ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_Wallet>> GetMoneyInWallet(Guid userId)
        {
            try
            {
                var wallet = await dbContext.wallets
                                    .Include(w => w.User)
                                    .FirstOrDefaultAsync(x => x.UserId == userId);

                if (wallet == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "User chưa có ví. Vui lòng tạo ví trước.", null);
                }

                var walletDto = converter_Wallet.EntityToDTO(wallet);

                return responseObject.responseObjectSuccess("Lấy thông tin ví thành công.", walletDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Server: " + ex.Message, null);
            }
        }
    }
}