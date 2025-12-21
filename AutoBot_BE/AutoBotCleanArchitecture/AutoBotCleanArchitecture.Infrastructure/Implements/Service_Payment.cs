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
using System.Linq;

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

        // =================================================================================
        // HÀM PHỤ TRỢ: QUẢN LÝ ĐƠN CŨ
        // Logic: 
        // 1. Nếu đơn cũ giống y hệt đơn mới (cùng tiền) và còn hạn -> Trả lại Link cũ.
        // 2. Nếu đơn cũ khác tiền HOẶC hết hạn -> Hủy đơn cũ đi để tạo đơn mới.
        // =================================================================================
        private async Task<string?> HandlePendingOrder(long newAmount, string orderType, Guid userId, Guid? botId = null, int? duration = null)
        {
            // Tìm BẤT KỲ đơn nào đang Pending của User này thuộc loại này (Deposit/BuyBot)
            // Không quan tâm số tiền cũ là bao nhiêu, cứ lôi đầu ra hết
            var pendingOrder = await _context.paymentOrders
                .FirstOrDefaultAsync(x => x.UserId == userId
                                       && x.OrderType == orderType
                                       && x.Status == "Pending");

            if (pendingOrder == null) return null; // Không có đơn cũ -> Tạo mới thoải mái

            // Case 1: Nếu đơn cũ GIỐNG HỆT đơn mới (Cùng số tiền/Bot) VÀ Chưa quá 15 phút
            // -> Thì trả lại link cũ cho đỡ tốn tài nguyên
            bool isSameOrder = false;
            if (orderType == "Deposit")
            {
                isSameOrder = (pendingOrder.Amount == newAmount);
            }
            else if (orderType == "BuyBot")
            {
                isSameOrder = (pendingOrder.BotTradingId == botId && pendingOrder.DurationMonths == duration);
            }

            if (isSameOrder && pendingOrder.CreatedDate > DateTime.UtcNow.AddMinutes(-15))
            {
                if (!string.IsNullOrEmpty(pendingOrder.CheckoutUrl))
                {
                    return pendingOrder.CheckoutUrl; // Tái sử dụng
                }
            }

            // Case 2: Nếu Khác mệnh giá HOẶC Đã hết hạn -> HỦY ĐƠN CŨ NGAY LẬP TỨC
            try
            {
                await _payOS.cancelPaymentLink(pendingOrder.OrderCode);
            }
            catch { /* Bỏ qua nếu lỗi mạng hoặc đã hủy rồi */ }

            _context.paymentOrders.Remove(pendingOrder);
            await _context.SaveChangesAsync(); // Xóa xong lưu lại để dọn đường cho đơn mới

            return null; // Trả về null để hàm chính tạo đơn mới
        }

        // =================================================================================
        // 1. TẠO LINK NẠP TIỀN (DEPOSIT)
        // =================================================================================
        public async Task<ResponseObject<string>> CreateWalletDepositLink(Request_Deposit request)
        {
            try
            {
                if (request.Amount < 2000)
                    return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Số tiền nạp tối thiểu là 2000 VNĐ", null);

                // --- XỬ LÝ ĐƠN CŨ ---
                // Gọi hàm check. Nếu nó trả về Link nghĩa là dùng lại đơn cũ.
                // Nếu nó trả về null nghĩa là nó đã xóa đơn cũ (nếu có) rồi.
                string? existingUrl = await HandlePendingOrder((long)request.Amount, "Deposit", request.UserId);
                if (existingUrl != null)
                {
                    return _responseString.responseObjectSuccess("Bạn có đơn nạp tiền chưa thanh toán (Link cũ).", existingUrl);
                }

                // --- TẠO ĐƠN MỚI ---
                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));

                var paymentData = new PaymentData(
                    orderCode,
                    (int)request.Amount,
                    "Nap tien vao vi",
                    new List<ItemData> { new ItemData("Nap tien", 1, (int)request.Amount) },
                    "http://localhost:3000/fail",
                    "http://localhost:3000/success"
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

                var order = new PaymentOrder
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = request.UserId,
                    Amount = request.Amount,
                    Status = "Pending",
                    OrderType = "Deposit",
                    CreatedDate = DateTime.UtcNow,
                    CheckoutUrl = createPayment.checkoutUrl
                };
                await _context.paymentOrders.AddAsync(order);
                await _context.SaveChangesAsync();

                return _responseString.responseObjectSuccess("Tạo link nạp tiền thành công", createPayment.checkoutUrl);
            }
            catch (Exception ex)
            {
                return _responseString.responseObjectError(500, ex.Message, null);
            }
        }

        // =================================================================================
        // 2. TẠO LINK MUA BOT (PAYOS)
        // =================================================================================
        public async Task<ResponseObject<string>> CreateBuyBotLink(Request_BuyBot request)
        {
            try
            {
                var user = await _context.users.FindAsync(request.UserId);
                if (user == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);

                var bot = await _context.botTradings.FindAsync(request.BotTradingId);
                if (bot == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", null);

                var pricePackage = await _context.priceBots.FindAsync(request.PriceBotId);
                if (pricePackage == null) return _responseString.responseObjectError(StatusCodes.Status404NotFound, "Gói giá không tồn tại", null);

                if (pricePackage.BotTradingId != request.BotTradingId)
                    return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Gói giá này không thuộc về Bot bạn chọn", null);

                int amount = (int)pricePackage.Price;
                if (amount < 2000) return _responseString.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị đơn hàng quá thấp (<2000đ)", null);

                // --- XỬ LÝ ĐƠN CŨ ---
                string? existingUrl = await HandlePendingOrder((long)amount, "BuyBot", request.UserId, request.BotTradingId, pricePackage.Month);
                if (existingUrl != null)
                {
                    return _responseString.responseObjectSuccess("Bạn có đơn mua Bot chưa thanh toán (Link cũ).", existingUrl);
                }

                // --- TẠO ĐƠN MỚI ---
                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));
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

                var order = new PaymentOrder
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = request.UserId,
                    BotTradingId = request.BotTradingId,
                    DurationMonths = pricePackage.Month,
                    Amount = (long)pricePackage.Price,
                    Status = "Pending",
                    OrderType = "BuyBot",
                    CreatedDate = DateTime.UtcNow,
                    CheckoutUrl = createPayment.checkoutUrl
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

        // =================================================================================
        // 3. MUA BOT BẰNG VÍ (WALLET)
        // =================================================================================
        public async Task<ResponseObject<bool>> BuyBotByWallet(Request_BuyBot request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.users.FindAsync(request.UserId);
                if (user == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", false);

                var bot = await _context.botTradings.FindAsync(request.BotTradingId);
                if (bot == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", false);

                var pricePackage = await _context.priceBots.FindAsync(request.PriceBotId);
                if (pricePackage == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Gói giá không tồn tại", false);

                if (pricePackage.BotTradingId != request.BotTradingId)
                    return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Gói giá này không thuộc về Bot bạn chọn", false);

                var wallet = await _context.wallets.FirstOrDefaultAsync(w => w.UserId == request.UserId);
                if (wallet == null) return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Bạn chưa có ví tiền.", false);

                if (wallet.Balance < pricePackage.Price)
                    return _responseBool.responseObjectError(StatusCodes.Status400BadRequest, $"Số dư không đủ. Cần {pricePackage.Price:N0}đ", false);

                // Trừ tiền
                wallet.Balance -= pricePackage.Price;
                _context.wallets.Update(wallet);

                // Cấp Bot
                var userBot = await _context.userBots.FirstOrDefaultAsync(x => x.UserId == request.UserId && x.BotTradingId == request.BotTradingId);
                DateTime startDate = DateTime.UtcNow;
                DateTime newExpiredDate;

                if (userBot == null)
                {
                    newExpiredDate = startDate.AddMonths(pricePackage.Month);
                    userBot = new UserBot { Id = Guid.NewGuid(), UserId = request.UserId, BotTradingId = request.BotTradingId, ExpiredDate = newExpiredDate };
                    await _context.userBots.AddAsync(userBot);
                }
                else
                {
                    startDate = userBot.ExpiredDate > DateTime.UtcNow ? userBot.ExpiredDate : DateTime.UtcNow;
                    newExpiredDate = startDate.AddMonths(pricePackage.Month);
                    userBot.ExpiredDate = newExpiredDate;
                    _context.userBots.Update(userBot);
                }

                long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss"));
                var history = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = request.UserId,
                    WalletId = wallet.Id,
                    BotTradingId = request.BotTradingId,
                    StartDate = startDate,
                    EndDate = newExpiredDate,
                    PriceBot = pricePackage.Price,
                    Date = DateTime.UtcNow,
                    PaymentMethod = "Wallet",
                    Status = "Paid"
                };
                await _context.purchaseHistories.AddAsync(history);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return _responseBool.responseObjectSuccess("Mua Bot bằng ví thành công!", true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                Console.WriteLine($"[WALLET ERROR] {errorMsg}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi xử lý: {errorMsg}", false);
            }
        }

        // =================================================================================
        // 4. WEBHOOK
        // =================================================================================
        public async Task<ResponseObject<bool>> ProcessWebhook(WebhookType webhookData)
        {
            try
            {
                Console.WriteLine($"[Webhook] Code: {webhookData.code}, Desc: {webhookData.desc}");
                WebhookData verifiedData = _payOS.verifyPaymentWebhookData(webhookData);

                if (webhookData.code == "00" && webhookData.desc == "success")
                {
                    var order = await _context.paymentOrders
                        .FirstOrDefaultAsync(x => x.OrderCode == verifiedData.orderCode);

                    if (order == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy đơn hàng.", false);
                    if (order.Status == "Success") return _responseBool.responseObjectSuccess("Đơn hàng đã thành công trước đó.", true);

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

        // =================================================================================
        // 5. CÁC HÀM KÍCH HOẠT
        // =================================================================================
        public async Task<ResponseObject<bool>> ActivateBotAfterPayment(long orderCode, double amount)
        {
            try
            {
                var orderData = await _context.paymentOrders.FirstOrDefaultAsync(x => x.OrderCode == orderCode);
                if (orderData == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Không có đơn hàng.", false);

                var botId = orderData.BotTradingId.Value;
                var duration = orderData.DurationMonths.Value;
                var userBot = await _context.userBots.FirstOrDefaultAsync(x => x.UserId == orderData.UserId && x.BotTradingId == botId);

                DateTime startDate = DateTime.UtcNow;
                DateTime newExpiredDate;

                if (userBot == null)
                {
                    newExpiredDate = startDate.AddMonths(duration);
                    userBot = new UserBot { Id = Guid.NewGuid(), UserId = orderData.UserId, BotTradingId = botId, ExpiredDate = newExpiredDate };
                    await _context.userBots.AddAsync(userBot);
                }
                else
                {
                    startDate = userBot.ExpiredDate > DateTime.UtcNow ? userBot.ExpiredDate : DateTime.UtcNow;
                    newExpiredDate = startDate.AddMonths(duration);
                    userBot.ExpiredDate = newExpiredDate;
                    _context.userBots.Update(userBot);
                }

                var history = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = orderData.UserId,
                    BotTradingId = botId,
                    PriceBot = amount,
                    StartDate = startDate,
                    EndDate = newExpiredDate,
                    Date = DateTime.UtcNow,
                    PaymentMethod = "PayOS",
                    Status = "Paid",
                    WalletId = null
                };
                await _context.purchaseHistories.AddAsync(history);

                orderData.Status = "Success";
                await _context.SaveChangesAsync();
                return _responseBool.responseObjectSuccess("Kích hoạt Bot thành công.", true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB ERROR - BUYBOT] {ex.Message}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        public async Task<ResponseObject<bool>> ActivateDepositAfterPayment(long orderCode, double amount)
        {
            try
            {
                var orderData = await _context.paymentOrders.FirstOrDefaultAsync(x => x.OrderCode == orderCode);
                if (orderData == null) return _responseBool.responseObjectError(StatusCodes.Status404NotFound, "Không có đơn hàng.", false);

                var wallet = await _context.wallets.FirstOrDefaultAsync(w => w.UserId == orderData.UserId);
                if (wallet == null)
                {
                    wallet = new Wallet { Id = Guid.NewGuid(), UserId = orderData.UserId, Balance = 0 };
                    await _context.wallets.AddAsync(wallet);
                    await _context.SaveChangesAsync();
                }

                wallet.Balance += amount;

                var history = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    OrderCode = orderCode,
                    UserId = orderData.UserId,
                    WalletId = wallet.Id,
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
                return _responseBool.responseObjectSuccess("Nạp tiền thành công.", true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB ERROR - DEPOSIT] {ex.Message}");
                return _responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        // =================================================================================
        // 6. RÚT TIỀN (GIỮ NGUYÊN)
        // =================================================================================
        public async Task<ResponseObject<bool>> RequestWithdrawMoney(Request_WithdrawMoney request)
        {
            try
            {
                if (request.BankAmount <= 0) return new ResponseObject<bool>(StatusCodes.Status400BadRequest, "Số tiền rút không hợp lệ", false);

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
                return new ResponseObject<bool>(StatusCodes.Status400BadRequest, "Lỗi", false);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_WithdrawMoney>>> GetWithdrawRequestsAsync(int pageNumber, int pageSize)
        {
            try
            {
                var query = _context.withdrawMoneys.Include(w => w.User).AsQueryable();
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

                if (data.Count == 0 && pageNumber > 1) return _responsePaginationWithdrawMoney.responseObjectSuccess("Trang này không có dữ liệu.", paginationData);

                return _responsePaginationWithdrawMoney.responseObjectSuccess("Lấy danh sách rút tiền thành công", paginationData);
            }
            catch (Exception ex)
            {
                return _responsePaginationWithdrawMoney.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}