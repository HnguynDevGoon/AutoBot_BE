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

        public async Task<ResponseObject<DTO_Wallet>> CreateWallet(Guid userId)
        {
            try
            {
                // 1. Kiểm tra user có tồn tại trong DB hay không
                var user = await dbContext.users
                    .FirstOrDefaultAsync(x => x.Id == userId);

                if (user == null)
                {
                    return responseObject.responseObjectError(
                        StatusCodes.Status404NotFound, "Người dùng không tồn tại.", null);
                }

                // 2. Kiểm tra ví đã tồn tại chưa
                var existingWallet = await dbContext.wallets.FirstOrDefaultAsync(x => x.UserId == userId);

                if (existingWallet != null)
                {
                    var dto = converter_Wallet.EntityToDTO(existingWallet);
                    return responseObject.responseObjectSuccess("Người dùng này đã có ví.", dto);
                }

                // 3. Tạo ví mới
                var newWallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Balance = 0,
                    User = user
                };

                dbContext.wallets.Add(newWallet);
                await dbContext.SaveChangesAsync();

                var walletDto = converter_Wallet.EntityToDTO(newWallet);

                return responseObject.responseObjectSuccess("Tạo ví thành công.", walletDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(
                    StatusCodes.Status500InternalServerError,
                    "Lỗi Server: " + ex.Message,
                    null
                );
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

                if (string.IsNullOrEmpty(wallet.WalletPin))
                {
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Bạn chưa thiết lập mã PIN. Vui lòng tạo mới.", null);
                }


                return responseObject.responseObjectSuccess("Lấy thông tin ví thành công.",
                    new DTO_Wallet { Balance = wallet.Balance }
                    );
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

            return responseObject.responseObjectSuccess("Tạo mã PIN thành công.", null);
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

            return responseObject.responseObjectSuccess("Mã PIN chính xác.", null);
        }

        public async Task<ResponseObject<DTO_Wallet>> GetWalletByUserId(Guid userId)
        {
            var wallet = await dbContext.wallets
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(x => x.UserId == userId);

            if (wallet == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Người dùng chưa kích hoạt ví.", null);
            }

            if (string.IsNullOrEmpty(wallet.WalletPin))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Bạn chưa thiết lập mã PIN cho ví.", null);
            }

            var walletDto = converter_Wallet.EntityToDTO(wallet);

            return responseObject.responseObjectSuccess("Lấy thông tin ví thành công.", walletDto);
        }

        public async Task<ResponseBase> SendOtpResetPin(Request_SendOtpResetPin request)
        {
            try
            {
                var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.UserId);
                if (user == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy user.");
                }

                var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id && x.Message == "Đặt lại PIN");
                if (oldCodes.Any())
                {
                    dbContext.confirmEmails.RemoveRange(oldCodes);
                }

                Random r = new Random();
                int code = r.Next(100000, 999999);

                var emailTo = new EmailTo
                {
                    Mail = user.Email,
                    Subject = "Mã xác nhận Reset PIN Ví",
                    Content = $"Mã xác nhận của bạn là: <b>{code}</b>. Mã sẽ hết hạn sau 2 phút!"
                };
                await emailTo.SendEmailAsync(emailTo);

                var confirmEmail = new ConfirmEmail
                {
                    Code = code.ToString(),
                    Message = "Đặt lại PIN", 
                    Starttime = DateTime.Now,
                    Expiredtime = DateTime.Now.AddMinutes(2),
                    UserId = user.Id
                };

                await dbContext.confirmEmails.AddAsync(confirmEmail);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Mã OTP đã được gửi đến email của bạn.");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseObject<DTO_Wallet>> ResetPin(Request_ResetPin request)
        {
            try
            {
                // 1. Tìm Ví
                var wallet = await dbContext.wallets.FirstOrDefaultAsync(x => x.UserId == request.UserId);
                if (wallet == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa có ví.", null);
                }

                // 2. Tìm OTP trong DB
                var confirmEmail = await dbContext.confirmEmails
                    .OrderByDescending(x => x.Starttime) 
                    .FirstOrDefaultAsync(x => x.UserId == request.UserId
                                           && x.Code == request.Otp
                                           && x.Message == "Đặt lại PIN");

                if (confirmEmail == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Mã OTP không chính xác.", null);
                }

                if (DateTime.Now > confirmEmail.Expiredtime)
                {
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Mã OTP đã hết hạn.", null);
                }

                wallet.WalletPin = null;

                dbContext.confirmEmails.Remove(confirmEmail);

                dbContext.wallets.Update(wallet);
                await dbContext.SaveChangesAsync();

                var walletDto = converter_Wallet.EntityToDTO(wallet);

                return responseObject.responseObjectSuccess("Xác thực thành công. Vui lòng tạo mã PIN mới.", walletDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

    }
}