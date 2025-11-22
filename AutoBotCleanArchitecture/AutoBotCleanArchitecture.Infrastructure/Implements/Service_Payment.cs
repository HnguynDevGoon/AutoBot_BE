using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory; 
using Net.payOS;
using Net.payOS.Types;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Payment : IService_Payment
    {
        private readonly AppDbContext _context;
        private readonly PayOS _payOS;
        private readonly IMemoryCache _cache; 
        private readonly ResponseObject<string> _responseString;
        private readonly ResponseObject<bool> _responseBool;

        public Service_Payment(
            AppDbContext context,
            PayOS payOS,
            IMemoryCache cache,
            ResponseObject<string> responseString,
            ResponseObject<bool> responseBool)
        {
            _context = context;
            _payOS = payOS;
            _cache = cache;
            _responseString = responseString;
            _responseBool = responseBool;
        }

        // Struct lưu tạm thông tin nạp tiền
        public struct DepositOrder
        {
            public Guid UserId;
            public long OrderCode;
            public int Amount;
        }

        // 1. TẠO LINK THANH TOÁN
        public async Task<ResponseObject<string>> CreateWalletDepositLink(Request_Deposit request)
        {
            try
            {
                if (request.Amount < 2000)
                {
                    return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Số tiền nạp tối thiểu là 2000 VNĐ", null);
                }

                var wallet = await _context.wallets.FirstOrDefaultAsync(w => w.UserId == request.UserId);

                if (wallet == null)
                {
                    return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa tạo ví. Vui lòng tạo ví trước khi nạp tiền.", null);
                }

                // Tạo mã đơn hàng (Random hoặc Time ticks)
                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));

                var items = new List<ItemData> { new ItemData("Nạp tiền vào ví", 1, request.Amount) };
                var paymentData = new PaymentData(
                    orderCode,
                    request.Amount,
                    "Nạp tiền vào ví",
                    items,
                    cancelUrl: "http://localhost:3000/fail", 
                    returnUrl: "http://localhost:3000/success" 
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

                // --- LƯU VÀO CACHE ---
                var orderData = new DepositOrder
                {
                    UserId = request.UserId,
                    OrderCode = orderCode,
                    Amount = request.Amount
                };
                // Lưu trong 15 phút, Key là "Deposit_UserId"
                _cache.Set($"Deposit_{request.UserId}", orderData, TimeSpan.FromMinutes(15));

                return _responseString.responseObjectSuccess("Tạo link thanh toán thành công", createPayment.checkoutUrl);
            }
            catch (Exception ex)
            {
                return _responseString.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 2. CHECK THANH TOÁN (Cộng tiền vào ví)
        public async Task<ResponseObject<bool>> VerifyDepositStatus(Guid userId)
        {
            try
            {
                // Lấy thông tin đơn hàng từ Cache
                if (!_cache.TryGetValue($"Deposit_{userId}", out DepositOrder orderData))
                {
                    return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Giao dịch không tồn tại hoặc đã hết hạn.", false);
                }

                // Hỏi PayOS xem đơn này đã PAID chưa
                PaymentLinkInformation paymentInfo = await _payOS.getPaymentLinkInformation(orderData.OrderCode);

                if (paymentInfo.status == "PAID")
                {
                    // Tìm hoặc Tạo ví cho User
                    var wallet = await _context.wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                    if (wallet == null)
                    {
                        wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 0 };
                        await _context.wallets.AddAsync(wallet);
                    }

                    // --- CỘNG TIỀN ---
                    wallet.Balance += orderData.Amount;

                    // Lưu lịch sử giao dịch
                    var transaction = new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        WalletId = wallet.Id,
                        Amount = orderData.Amount,
                        OrderCode = orderData.OrderCode,
                        TransactionType = "Tiền nạp",
                        Description = "Nạp tiền vào ví qua PayOS",
                        TransactionStatus = "Success",
                        Timestamp = DateTime.UtcNow
                    };
                    await _context.walletTransactions.AddAsync(transaction);

                    await _context.SaveChangesAsync();

                    // Xóa Cache để không cộng tiền lần 2
                    _cache.Remove($"Deposit_{userId}");

                    return _responseBool.responseObjectSuccess("Nạp tiền thành công", true);
                }
                else
                {
                    return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Giao dịch chưa hoàn tất hoặc bị hủy.", false);
                }
            }
            catch (Exception ex)
            {
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        // 3. WEBHOOK (Dự phòng)
        //public async Task<ResponseObject<bool>> HandlePayOSWebhook(WebhookType webhookBody)
        //{
        //    try
        //    {
        //        WebhookData data = _payOS.verifyPaymentWebhookData(webhookBody);
        //        return _responseBool.responseObjectSuccess("Webhook received", true);
        //    }
        //    catch (Exception ex)
        //    {
        //        return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
        //    }
        //}
    }
}