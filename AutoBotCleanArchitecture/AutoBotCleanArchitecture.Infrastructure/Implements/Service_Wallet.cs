using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
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
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại.", null);
                }

                var existingWallet = await dbContext.wallets.FirstOrDefaultAsync(x => x.UserId == userId);
                if (existingWallet != null)
                {
                    var dto = converter_Wallet.EntityToDTO(existingWallet);
                    return responseObject.responseObjectSuccess("Người dùng này đã có ví.", dto);
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
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Người dùng chưa có ví. Vui lòng tạo ví trước.", null);
                }

                var walletDto = converter_Wallet.EntityToDTO(wallet);

                return responseObject.responseObjectSuccess("Lấy thông tin ví thành công.", walletDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Server: " + ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_Wallet>> CreatePinWallet(Request_CreatePinWallet request)
        {
            if (string.IsNullOrWhiteSpace(request.Pin) || request.Pin.Length != 6 || !int.TryParse(request.Pin, out _))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Mã PIN phải là 6 chữ số.", null);
            }

            if (request.Pin != request.ConfirmPin)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Xác nhận mã PIN không khớp.", null);
            }

            var wallet = await dbContext.wallets.FirstOrDefaultAsync(x => x.UserId == request.UserId);

            if (wallet == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa có ví.", null);
            }

            if (!string.IsNullOrEmpty(wallet.WalletPin))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Ví này đã có mã PIN rồi.", null);
            }

            wallet.WalletPin = BCrypt.Net.BCrypt.HashPassword(request.Pin);

            dbContext.wallets.Update(wallet);
            await dbContext.SaveChangesAsync();

            await dbContext.Entry(wallet).Reference(w => w.User).LoadAsync();
            var walletDto = converter_Wallet.EntityToDTO(wallet);

            return responseObject.responseObjectSuccess("Tạo mã PIN thành công.", walletDto);
        }

        public async Task<ResponseObject<DTO_Wallet>> CheckPinWallet(Request_CheckPinWallet request)
        {
            var wallet = await dbContext.wallets
                                .Include(w => w.User)
                                .FirstOrDefaultAsync(x => x.UserId == request.UserId);

            if (wallet == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa có ví.", null);
            }

            if (string.IsNullOrEmpty(wallet.WalletPin))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Bạn chưa thiết lập mã PIN cho ví.", null);
            }

            bool isPinValid = BCrypt.Net.BCrypt.Verify(request.Pin, wallet.WalletPin);

            if (!isPinValid)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Mã PIN không chính xác.", null);
            }

            var walletDto = converter_Wallet.EntityToDTO(wallet);
            return responseObject.responseObjectSuccess("Mã PIN chính xác.", walletDto);
        }

    }
}