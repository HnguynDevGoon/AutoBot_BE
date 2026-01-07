using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_PurchaseHistory : IService_PurchaseHistory
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_PurchaseHistory converter;
        private readonly IHttpContextAccessor httpContextAccessor;

        private readonly ResponseObject<DTO_PurchaseHistory> responseObjectPurchase;
        private readonly ResponseObject<List<DTO_PurchaseHistory>> responseObjectListPurchase;
        private readonly ResponseObject<ResponsePagination<DTO_PurchaseHistory>> responseObjectPaginationPurchase;
        private readonly ResponseObject<DTO_RevenueResponse> responseObjectRevenue;
        private readonly ResponseBase responseBase;

        public Service_PurchaseHistory(
            AppDbContext dbContext,
            Converter_PurchaseHistory converter,
            IHttpContextAccessor httpContextAccessor,
            ResponseObject<DTO_PurchaseHistory> responseObjectPurchase,
            ResponseObject<List<DTO_PurchaseHistory>> responseObjectListPurchase,
            ResponseObject<ResponsePagination<DTO_PurchaseHistory>> responseObjectPaginationPurchase,
            ResponseObject<DTO_RevenueResponse> responseObjectRevenue,
            ResponseBase responseBase)
        {
            this.dbContext = dbContext;
            this.converter = converter;
            this.httpContextAccessor = httpContextAccessor;
            this.responseObjectPurchase = responseObjectPurchase;
            this.responseObjectListPurchase = responseObjectListPurchase;
            this.responseObjectPaginationPurchase = responseObjectPaginationPurchase;
            this.responseObjectRevenue = responseObjectRevenue;
            this.responseBase = responseBase;
        }

        // =================================================================================
        // PHẦN 1: USER (CÁ NHÂN) - TỰ ĐỘNG CHECK TOKEN
        // (Logic lấy ID được viết trực tiếp trong hàm)
        // =================================================================================

        public async Task<ResponseObject<ResponsePagination<DTO_PurchaseHistory>>> GetMyHistoryDynamic(string orderType, string paymentMethod, int pageSize, int pageNumber)
        {
            try
            {
                // --- 1. LẤY USER ID TỪ TOKEN (GIỮ NGUYÊN FORM CỦA ÔNG) ---
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString)) userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return responseObjectPaginationPurchase.responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", null);
                }

                // --- 2. PHÂN TRANG ---
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                // --- 3. QUERY LINH HOẠT ---
                var query = dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId) // Luôn lọc theo thằng đang login
                    .AsQueryable();

                // Nếu có truyền orderType thì mới lọc
                if (!string.IsNullOrEmpty(orderType))
                {
                    query = query.Where(x => x.OrderType == orderType);
                }

                // Nếu có truyền paymentMethod thì mới lọc
                if (!string.IsNullOrEmpty(paymentMethod))
                {
                    query = query.Where(x => x.PaymentMethod == paymentMethod);
                }

                query = query.OrderByDescending(x => x.Date);

                // --- 4. THỰC THI ---
                var totalItems = await query.CountAsync();
                var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
                var dtos = items.Select(x => converter.EntityToDTO(x)).ToList();

                var pagedResult = new ResponsePagination<DTO_PurchaseHistory>
                {
                    Items = dtos,
                    CurrentPage = pageNumber,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
                };

                return responseObjectPaginationPurchase.responseObjectSuccess("Lấy lịch sử thành công.", pagedResult);
            }
            catch (Exception ex)
            {
                return responseObjectPaginationPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 2. Xem giao dịch gần nhất của tôi
        public async Task<ResponseObject<DTO_PurchaseHistory>> GetMyLastPurchase()
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString)) userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return responseObjectPurchase.responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", null);
                }

                var entity = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.Date)
                    .FirstOrDefaultAsync();

                if (entity == null) return responseObjectPurchase.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa có giao dịch nào.", null);
                return responseObjectPurchase.responseObjectSuccess("Thành công.", converter.EntityToDTO(entity));
            }
            catch (Exception ex) { return responseObjectPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        // 3. Lọc lịch sử theo tháng của tôi
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistoryByMonth(int month, int year)
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString)) userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return responseObjectListPurchase.responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", null);
                }

                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId && x.Date.Month == month && x.Date.Year == year)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess($"Lịch sử tháng {month}/{year}.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        // 4. Lọc lịch sử theo năm của tôi
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistoryByYear(int year)
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString)) userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return responseObjectListPurchase.responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", null);
                }

                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId && x.Date.Year == year)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess($"Lịch sử năm {year}.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        // 5. Giao dịch Bot đã hoàn thành
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyBoughtBots()
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return responseObjectListPurchase.responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", null);
                }

                // 2. Truy vấn từ PurchaseHistory
                var list = await dbContext.purchaseHistories
                    .Include(x => x.BotTrading) 
                    .Where(x => x.UserId == userId
                             && x.BotTradingId != null  
                             && x.Status == "Paid")  
                    .OrderByDescending(x => x.StartDate) 
                    .ToListAsync();

                return responseObjectListPurchase.responseObjectSuccess(
                    "Lấy danh sách Bot đã mua thành công.",
                    list.Select(x => converter.EntityToDTO(x)).ToList()
                );
            }
            catch (Exception ex)
            {
                return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 6. Tổng tiền đã sử dụng mua Bot
        public async Task<ResponseObject<double>> GetTotalSpentOnBots()
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                var userIdString = user?.FindFirst("Id")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return new ResponseObject<double>().responseObjectError(StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập.", 0);
                }

                double totalSum = await dbContext.purchaseHistories
                    .Where(x => x.UserId == userId
                             && x.BotTradingId != null  
                             && x.Status == "Paid")     
                    .SumAsync(x => x.PriceBot);         

                return new ResponseObject<double>().responseObjectSuccess(
                    $"Tổng tiền bạn đã đầu tư vào Bot là: {totalSum:N0}", totalSum);
            }
            catch (Exception ex)
            {
                return new ResponseObject<double>().responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, 0);
            }
        }

        // =================================================================================
        // PHẦN 2: ADMIN (QUẢN LÝ) - CẦN TRUYỀN USERID VÀO
        // =================================================================================

        public async Task<ResponseBase> DeletePurchaseHistory(Guid id)
        {
            try
            {
                var item = await dbContext.purchaseHistories.FindAsync(id);
                if (item == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");
                dbContext.purchaseHistories.Remove(item);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }

        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetAll()
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess("Lấy tất cả thành công.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetByUser(Guid userId)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess("Lấy danh sách user thành công.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }


        public async Task<ResponseObject<DTO_PurchaseHistory>> GetLastPurchaseByUser(Guid userId)
        {
            try
            {
                var entity = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.Date)
                    .FirstOrDefaultAsync();

                if (entity == null) return responseObjectPurchase.responseObjectError(StatusCodes.Status404NotFound, "User chưa có giao dịch nào.", null);
                return responseObjectPurchase.responseObjectSuccess("Thành công.", converter.EntityToDTO(entity));
            }
            catch (Exception ex) { return responseObjectPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesMonthByUser(Guid userId, int month, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId && x.Date.Month == month && x.Date.Year == year)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess($"Lịch sử tháng {month}/{year}.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesYearByUser(Guid userId, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.UserId == userId && x.Date.Year == year)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();
                return responseObjectListPurchase.responseObjectSuccess($"Lịch sử năm {year}.", list.Select(x => converter.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectListPurchase.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }


        // =================================================================================
        // PHẦN 3: THỐNG KÊ DOANH THU (ADMIN)
        // =================================================================================

        private DTO_RevenueResponse CalculateRevenue(List<PurchaseHistory> list)
        {
            return new DTO_RevenueResponse { TotalRevenue = list.Sum(x => x.PriceBot), Purchases = list.Select(x => converter.EntityToDTO(x)).ToList() };
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByMonth(int month, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories.Include(x => x.User).Include(x => x.BotTrading).Where(x => x.Date.Month == month && x.Date.Year == year).ToListAsync();
                return responseObjectRevenue.responseObjectSuccess($"Doanh thu tháng {month}/{year}.", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseObjectRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByYear(int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories.Include(x => x.User).Include(x => x.BotTrading).Where(x => x.Date.Year == year).ToListAsync();
                return responseObjectRevenue.responseObjectSuccess($"Doanh thu năm {year}.", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseObjectRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByDateRange(DateTime from, DateTime to)
        {
            try
            {
                var toDate = to.Date.AddDays(1).AddTicks(-1);
                var list = await dbContext.purchaseHistories.Include(x => x.User).Include(x => x.BotTrading).Where(x => x.Date >= from && x.Date <= toDate).ToListAsync();
                return responseObjectRevenue.responseObjectSuccess("Doanh thu theo khoảng thời gian.", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseObjectRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }
    }
}