using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Wallet;
using AutoBotCleanArchitecture.Application.Requests.WithdrawMoney;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using AutoBotCleanArchitecture.Application.Requests.Payment;
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
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ResponseObject<ResponsePagination<DTO_WithdrawMoney>> _responsePaginationWithdrawMoney;

        public Service_Payment(AppDbContext context, PayOS payOS, IMemoryCache cache, ResponseObject<string> responseString, ResponseObject<bool> responseBool, IHttpContextAccessor httpContextAccessor, ResponseObject<ResponsePagination<DTO_WithdrawMoney>> responsePaginationWithdrawMoney)
        {
            _context = context;
            _payOS = payOS;
            _cache = cache;
            _responseString = responseString;
            _responseBool = responseBool;
            _httpContextAccessor = httpContextAccessor;
            _responsePaginationWithdrawMoney = responsePaginationWithdrawMoney;
        }



        // Struct lưu tạm thông tin nạp tiền
        public struct DepositOrder
        {
            public Guid UserId;
            public long OrderCode;
            public double Amount;
        }

        public struct BuyBotOrder
        {
            public Guid UserId;
            public Guid BotTradingId;
            public int DurationMonths; // Số tháng mua
            public double Amount;
            public long OrderCode;
        }

        // 1. TẠO LINK THANH TOÁN
        public async Task<ResponseObject<string>> CreateWalletDepositLink(Request_Deposit request)
        {
            try
            {
                if (request.Amount < 2000)
                    return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Số tiền nạp tối thiểu là 2000 VNĐ", null);

                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));

                // LƯU VÀO DB THAY VÌ CACHE
                var order = new PaymentOrder
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = request.UserId,
                    Amount = request.Amount,
                    Status = "Pending",
                    OrderType = "Deposit" // Giao dịch nạp tiền
                };
                await _context.paymentOrders.AddAsync(order);
                await _context.SaveChangesAsync();

                var paymentData = new PaymentData(
                    orderCode, request.Amount, "Nap tien vao vi",
                    new List<ItemData> { new ItemData("Nap tien", 1, request.Amount) },
                    "http://localhost:3000/fail", "http://localhost:3000/success"
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);
                return _responseString.responseObjectSuccess("Thành công", createPayment.checkoutUrl);
            }
            catch (Exception ex)
            {
                return _responseString.responseObjectError(500, ex.Message, null);
            }
        }

        public async Task<ResponseObject<bool>> ActivateBotAfterPayment(long orderCode, double amount)
        {
            try
            {
                // 1. Tìm đúng dòng đang Pending
                var orderData = await _context.paymentOrders
                    .FirstOrDefaultAsync(x => x.OrderCode == orderCode && x.Status == "Pending");

                if (orderData == null) return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Không có đơn hàng.", false);

                // 2. Chống xử lý trùng
                var isExist = await _context.purchaseHistories.AnyAsync(x => x.OrderCode == orderCode);
                if (isExist) return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Đơn hàng đã tồn tại.", false);

                // --- CHECK NULL QUAN TRỌNG ---
                // Vì bảng PaymentOrder giờ dùng chung cho cả nạp tiền (có thể null), 
                // nhưng đây là hàm Mua Bot nên bắt buộc phải có BotId và Duration.
                if (orderData.BotTradingId == null || orderData.DurationMonths == null)
                {
                    Console.WriteLine("[ERROR] Đơn hàng mua Bot nhưng thiếu thông tin BotId hoặc Duration.");
                    return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Lỗi.", false);
                }

                // 3. Logic tính toán ngày gia hạn
                // Dùng .Value để lấy giá trị thực từ biến nullable
                var botId = orderData.BotTradingId.Value;
                var duration = orderData.DurationMonths.Value;

                var userBot = await _context.userBots
                    .FirstOrDefaultAsync(x => x.UserId == orderData.UserId && x.BotTradingId == botId);

                DateTime startDate = DateTime.UtcNow;
                DateTime newExpiredDate;

                if (userBot == null)
                {
                    // Mua mới
                    newExpiredDate = startDate.AddMonths(duration);
                    userBot = new UserBot
                    {
                        Id = Guid.NewGuid(),
                        UserId = orderData.UserId,
                        BotTradingId = botId,
                        ExpiredDate = newExpiredDate
                    };
                    await _context.userBots.AddAsync(userBot);
                }
                else
                {
                    // Gia hạn
                    startDate = userBot.ExpiredDate > DateTime.UtcNow ? userBot.ExpiredDate : DateTime.UtcNow;
                    newExpiredDate = startDate.AddMonths(duration);
                    userBot.ExpiredDate = newExpiredDate;
                    _context.userBots.Update(userBot);
                }

                // 4. Ghi history
                var history = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = orderData.UserId,
                    BotTradingId = botId,

                    PriceBot = amount, // Không cần ép kiểu nữa vì tham số đã là double

                    StartDate = startDate,
                    EndDate = newExpiredDate,
                    Date = DateTime.UtcNow,
                    PaymentMethod = "PayOS",
                    Status = "Paid"
                };
                await _context.purchaseHistories.AddAsync(history);

                // 5. Update trạng thái
                orderData.Status = "Success";

                await _context.SaveChangesAsync();
                return _responseBool.responseObjectSuccess("Thanh toán thành công. Bot đã được kích hoạt.", true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB ERROR] {ex.Message}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        public async Task<ResponseObject<bool>> ActivateDepositAfterPayment(long orderCode, double amount)
        {
            try
            {
                var orderData = await _context.paymentOrders
                    .FirstOrDefaultAsync(x => x.OrderCode == orderCode && x.Status == "Pending");

                if (orderData == null)
                {
                    return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Đơn hàng không tồn tại hoặc đã được xử lý.", false);
                }

                var isExist = await _context.purchaseHistories.AnyAsync(x => x.OrderCode == orderCode);
                if (isExist)
                {
                    return _responseBool.responseObjectSuccess("Giao dịch này đã được xử lý thành công trước đó.", true);
                }
                var wallet = await _context.wallets.FirstOrDefaultAsync(w => w.UserId == orderData.UserId);

                if (wallet == null)
                {
                    wallet = new Wallet { Id = Guid.NewGuid(), UserId = orderData.UserId, Balance = 0 };
                    await _context.wallets.AddAsync(wallet);
                }

                wallet.Balance += amount;

                var history = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = orderData.UserId,

                    BotTradingId = null,
                    StartDate = null,
                    EndDate = null,

                    PriceBot = amount,
                    Date = DateTime.UtcNow,
                    PaymentMethod = "PayOS",
                    Status = "Paid"
                };
                await _context.purchaseHistories.AddAsync(history);

                orderData.Status = "Success";

                await _context.SaveChangesAsync();

                return _responseBool.responseObjectSuccess("Nạp tiền vào ví thành công.", true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB ERROR - DEPOSIT] {ex.Message}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi hệ thống: {ex.Message}", false);
            }
        }

        public async Task<ResponseObject<bool>> RequestWithdrawMoney(Request_WithdrawMoney request)
        {
            try
            {
                if (request.BankAmount <= 0)
                {
                    return new ResponseObject<bool>(StatusCodes.Status400BadRequest, "Số tiền rút không hợp lệ", false);
                }

                var withdraw = new WithdrawMoney
                {
                    BankName = request.BankName,
                    BankAmount = request.BankAmount,
                    BankCode = request.BankCode,
                    UserBankName = request.UserBankName,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Pending",
                    QrCode = request.QrCode,
                    Note = request.Note,
                    UserId = request.UserId
                };

                await _context.withdrawMoneys.AddAsync(withdraw);
                await _context.SaveChangesAsync();

                return new ResponseObject<bool>(StatusCodes.Status200OK, "Gửi yêu cầu rút tiền thành công", true);
            }
            catch (Exception ex)
            {
                return new ResponseObject<bool>(StatusCodes.Status400BadRequest, "a", false);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_WithdrawMoney>>> GetWithdrawRequestsAsync(int pageNumber, int pageSize)
        {
            try
            {
                var query = _context.withdrawMoneys
                    .Include(w => w.User)
                    .AsQueryable();

                var totalItems = await query.CountAsync();

                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                var data = await query
                    .OrderByDescending(w => w.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(w => new DTO_WithdrawMoney
                    {
                        Id = w.Id,
                        FullName = w.User != null ? w.User.FullName : "Unknown",
                        UserName = w.User != null ? w.User.UserName : "Unknown",
                        Email = w.User != null ? w.User.Email : "Unknown",
                        BankName = w.BankName,
                        BankCode = w.BankCode,
                        UserBankName = w.UserBankName,
                        QrCode = w.QrCode,
                        BankAmount = w.BankAmount,
                        CreatedAt = w.CreatedAt,
                        Status = w.Status
                    })
                    .ToListAsync();

                var paginationData = new ResponsePagination<DTO_WithdrawMoney>
                {
                    Items = data,
                    CurrentPage = pageNumber,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                // 6. Trả về kết quả
                if (data.Count == 0 && pageNumber > 1)
                {
                    return _responsePaginationWithdrawMoney.responseObjectSuccess("Trang này không có dữ liệu.", paginationData);
                }

                return _responsePaginationWithdrawMoney.responseObjectSuccess("Lấy danh sách rút tiền thành công", paginationData);
            }
            catch (Exception ex)
            {
                return _responsePaginationWithdrawMoney.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        //public async Task<ResponseObject<string>> CreateBuyBotLink(Request_BuyBot request)
        //{
        //    try
        //    {
        //        // A. Validate dữ liệu
        //        var user = await _context.users.FindAsync(request.UserId);
        //        if (user == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);

        //        var bot = await _context.botTradings.FindAsync(request.BotTradingId);
        //        if (bot == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", null);

        //        // Tìm gói giá để lấy số tiền
        //        var pricePackage = await _context.priceBots.FindAsync(request.PriceBotId);
        //        if (pricePackage == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Gói giá không tồn tại", null);

        //        // Validate gói giá có thuộc Bot này không
        //        if (pricePackage.BotTradingId != request.BotTradingId)
        //            return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Gói giá này không thuộc về Bot bạn chọn", null);

        //        // B. Tạo Payment Data
        //        int amount = (int)pricePackage.Price; // PayOS nhận int
        //        if (amount < 2000) return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị đơn hàng quá thấp (<2000đ)", null);

        //        long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));
        //        string description = $"Mua {bot.NameBot} {pricePackage.Month} thang"; // Không dấu, ngắn gọn
        //        if (description.Length > 25) description = description.Substring(0, 25);

        //        var items = new List<ItemData> { new ItemData(description, 1, amount) };
        //        var paymentData = new PaymentData(
        //            orderCode,
        //            amount,
        //            description,
        //            items,
        //            cancelUrl: "http://localhost:3000/fail", // Link FE
        //            returnUrl: "http://localhost:3000/success" // Link FE
        //        );

        //        CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

        //        // C. Lưu Cache (Để tí nữa Verify biết là đang mua cái gì)
        //        var orderData = new BuyBotOrder
        //        {
        //            UserId = request.UserId,
        //            BotTradingId = request.BotTradingId,
        //            DurationMonths = pricePackage.Month,
        //            Amount = pricePackage.Price,
        //            OrderCode = orderCode
        //        };

        //        // Key Cache khác với key nạp tiền nhé ("BuyBot_...")
        //        _cache.Set($"BuyBot_{orderCode}", orderData, TimeSpan.FromMinutes(15));

        //        return _responseString.responseObjectSuccess("Tạo link mua Bot thành công", createPayment.checkoutUrl);
        //    }
        //    catch (Exception ex)
        //    {
        //        return _responseString.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
        //    }
        //}

        public async Task<ResponseObject<string>> CreateBuyBotLink(Request_BuyBot request)
        {
            try
            {
                // A. Validate dữ liệu (Giữ nguyên phần tìm User, Bot, PricePackage của bạn)
                var user = await _context.users.FindAsync(request.UserId);
                if (user == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);

                var bot = await _context.botTradings.FindAsync(request.BotTradingId);
                if (bot == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", null);

                var pricePackage = await _context.priceBots.FindAsync(request.PriceBotId);
                if (pricePackage == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Gói giá không tồn tại", null);

                if (pricePackage.BotTradingId != request.BotTradingId)
                    return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Gói giá này không thuộc về Bot bạn chọn", null);

                // B. Tạo Payment Data
                int amount = (int)pricePackage.Price;
                if (amount < 2000) return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị đơn hàng quá thấp (<2000đ)", null);

                // Tạo OrderCode duy nhất
                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));
                amount = (int)pricePackage.Price;
                string description = $"Mua {bot.NameBot} {pricePackage.Month} thang";

                var paymentData = new PaymentData(
                    orderCode,
                    amount,
                    description,
                    new List<ItemData> { new ItemData(description, 1, amount) },
                    cancelUrl: "http://localhost:3000/fail",
                    returnUrl: "http://localhost:3000/success"
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

                // C. LƯU VÀO ENTITY PAYMENTORDER CỦA BẠN
                var order = new PaymentOrder
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = request.UserId,
                    BotTradingId = request.BotTradingId,
                    DurationMonths = pricePackage.Month,
                    Amount = (long)pricePackage.Price, // Gán vào trường Amount (long)
                    Status = "Pending", // Trạng thái chờ xử lý
                    OrderType = "BuyBot"
                };

                await _context.paymentOrders.AddAsync(order);
                await _context.SaveChangesAsync();

                return _responseString.responseObjectSuccess("Tạo link mua Bot thành công", createPayment.checkoutUrl);
            }
            catch (Exception ex)
            {
                return _responseString.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 2. XÁC THỰC VÀ KÍCH HOẠT BOT (Verify)
        //public async Task<ResponseObject<bool>> VerifyBuyBotStatus(long orderCode)
        //{
        //    try
        //    {
        //        // A. Lấy thông tin từ Cache
        //        if (!_cache.TryGetValue($"BuyBot_{orderCode}", out BuyBotOrder orderData))
        //        {
        //            return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Đơn hàng đã hết hạn hoặc không tồn tại.", false);
        //        }

        //        // B. Check PayOS
        //        PaymentLinkInformation paymentInfo = await _payOS.getPaymentLinkInformation(orderCode);

        //        if (paymentInfo.status == "PAID")
        //        {
        //            // C. LOGIC GIA HẠN / KÍCH HOẠT (QUAN TRỌNG)

        //            // Tìm xem user đã có bot này chưa
        //            var userBot = await _context.userBots
        //                .FirstOrDefaultAsync(x => x.UserId == orderData.UserId && x.BotTradingId == orderData.BotTradingId);

        //            DateTime newExpiredDate;

        //            if (userBot == null)
        //            {
        //                // Trường hợp 1: Mua mới tinh
        //                newExpiredDate = DateTime.UtcNow.AddMonths(orderData.DurationMonths);

        //                userBot = new UserBot
        //                {
        //                    Id = Guid.NewGuid(),
        //                    UserId = orderData.UserId,
        //                    BotTradingId = orderData.BotTradingId,
        //                    ExpiredDate = newExpiredDate,
        //                };
        //                await _context.userBots.AddAsync(userBot);
        //            }
        //            else
        //            {
        //                // Trường hợp 2: Gia hạn
        //                if (userBot.ExpiredDate > DateTime.UtcNow)
        //                {
        //                    // Nếu còn hạn -> Cộng nối tiếp vào ngày hết hạn cũ
        //                    userBot.ExpiredDate = userBot.ExpiredDate.AddMonths(orderData.DurationMonths);
        //                }
        //                else
        //                {
        //                    // Nếu đã hết hạn -> Tính từ ngày hôm nay
        //                    userBot.ExpiredDate = DateTime.UtcNow.AddMonths(orderData.DurationMonths);
        //                }
        //                _context.userBots.Update(userBot);
        //            }

        //            // D. Ghi Log PurchaseHistory
        //            var history = new PurchaseHistory
        //            {
        //                Id = Guid.NewGuid(),
        //                UserId = orderData.UserId,
        //                BotTradingId = orderData.BotTradingId, // Có cái này là ngon rồi
        //                PriceBot = orderData.Amount,
        //                PaymentMethod = "PayOS",
        //                Status = "Paid",
        //                StartDate = DateTime.UtcNow,
        //                EndDate = DateTime.UtcNow.AddMonths(orderData.DurationMonths), // Lưu để đối chiếu
        //                Date = DateTime.UtcNow
        //            };
        //            await _context.purchaseHistories.AddAsync(history);

        //            // E. Lưu DB và Xóa Cache
        //            await _context.SaveChangesAsync();
        //            _cache.Remove($"BuyBot_{orderCode}");

        //            return _responseBool.responseObjectSuccess("Thanh toán thành công. Bot đã được kích hoạt.", true);
        //        }

        //        return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Chưa thanh toán xong.", false);
        //    }
        //    catch (Exception ex)
        //    {
        //        return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
        //    }
        //}

        // SỬA LẠI TRONG PAYMENT SERVICE
        //public async Task<bool> ActivateBotAfterPayment(long orderCode, long amount)
        //{
        //    try
        //    {
        //        // 1. Lấy thông tin từ Cache (Hoặc DB nếu bạn đã chuyển sang DB)
        //        if (!_cache.TryGetValue($"BuyBot_{orderCode}", out BuyBotOrder orderData))
        //        {
        //            return false;
        //        }

        //        // 2. Kiểm tra tránh trùng lặp (Idempotency)
        //        // Check xem OrderCode này đã có trong lịch sử chưa
        //        var isExist = await _context.purchaseHistories.AnyAsync(x => x.OrderCode == orderCode);
        //        if (isExist) return true;

        //        // 3. Logic kích hoạt/gia hạn (Giữ nguyên của bạn)
        //        var userBot = await _context.userBots
        //            .FirstOrDefaultAsync(x => x.UserId == orderData.UserId && x.BotTradingId == orderData.BotTradingId);

        //        if (userBot == null)
        //        {
        //            userBot = new UserBot
        //            {
        //                Id = Guid.NewGuid(),
        //                UserId = orderData.UserId,
        //                BotTradingId = orderData.BotTradingId,
        //                ExpiredDate = DateTime.UtcNow.AddMonths(orderData.DurationMonths),
        //            };
        //            await _context.userBots.AddAsync(userBot);
        //        }
        //        else
        //        {
        //            userBot.ExpiredDate = (userBot.ExpiredDate > DateTime.UtcNow ? userBot.ExpiredDate : DateTime.UtcNow)
        //                                  .AddMonths(orderData.DurationMonths);
        //            _context.userBots.Update(userBot);
        //        }

        //        // 4. Ghi Log PurchaseHistory
        //        var history = new PurchaseHistory
        //        {
        //            Id = Guid.NewGuid(),
        //            OrderCode = orderCode, // Cần thêm field này vào Model để quản lý
        //            UserId = orderData.UserId,
        //            BotTradingId = orderData.BotTradingId,
        //            PriceBot = amount,
        //            PaymentMethod = "PayOS_Webhook",
        //            Status = "Paid",
        //            Date = DateTime.UtcNow
        //        };
        //        await _context.purchaseHistories.AddAsync(history);

        //        await _context.SaveChangesAsync();
        //        _cache.Remove($"BuyBot_{orderCode}");

        //        return true;
        //    }
        //    catch (Exception)
        //    {
        //        return false;
        //    }
        //}

        public async Task<ResponseObject<bool>> ProcessWebhook(WebhookType webhookData)
        {
            try
            {
                // 1. Xác thực chữ ký PayOS
                WebhookData verifiedData = _payOS.verifyPaymentWebhookData(webhookData);

                // 2. Kiểm tra trạng thái thành công
                if (webhookData.code == "00" && webhookData.desc == "success")
                {
                    // 3. Tìm thông tin đơn hàng trong DB
                    var order = await _context.paymentOrders
                        .FirstOrDefaultAsync(x => x.OrderCode == verifiedData.orderCode && x.Status == "Pending");

                    if (order == null) return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Không tìm thấy đơn hàng.", false);

                    // 4. Kiểm tra chuỗi string để điều hướng
                    if (order.OrderType == "BuyBot")
                    {
                        return await ActivateBotAfterPayment(order.OrderCode, verifiedData.amount);
                    }
                    else if (order.OrderType == "Deposit")
                    {
                        return await ActivateDepositAfterPayment(order.OrderCode, verifiedData.amount);
                    }
                }
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi đơn hàng", false);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Webhook Error] {ex.Message}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }
    }
}

