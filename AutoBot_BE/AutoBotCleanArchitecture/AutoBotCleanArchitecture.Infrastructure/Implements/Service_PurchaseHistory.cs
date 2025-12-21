using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.PurchaseHistory;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_PurchaseHistory : IService_PurchaseHistory
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_PurchaseHistory converter;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // Các Response Object
        private readonly ResponseObject<DTO_PurchaseHistory> responseSingle;
        private readonly ResponseObject<List<DTO_PurchaseHistory>> responseList;
        private readonly ResponseObject<DTO_RevenueResponse> responseRevenue;
        private readonly ResponseBase responseBase;

        public Service_PurchaseHistory(
            AppDbContext dbContext,
            Converter_PurchaseHistory converter,
            IHttpContextAccessor httpContextAccessor,
            ResponseObject<DTO_PurchaseHistory> responseSingle,
            ResponseObject<List<DTO_PurchaseHistory>> responseList,
            ResponseObject<DTO_RevenueResponse> responseRevenue,
            ResponseBase responseBase)
        {
            this.dbContext = dbContext;
            this.converter = converter;
            _httpContextAccessor = httpContextAccessor;
            this.responseSingle = responseSingle;
            this.responseList = responseList;
            this.responseRevenue = responseRevenue;
            this.responseBase = responseBase;
        }

        // 1. ADD (Thêm mới)
        public async Task<ResponseObject<DTO_PurchaseHistory>> AddPurchaseHistory(Request_AddPurchaseHistory request)
        {
            try
            {
                var userExists = await dbContext.users.AnyAsync(x => x.Id == request.UserId);
                if (!userExists) return responseSingle.responseObjectError(StatusCodes.Status404NotFound, "User không tồn tại", null);

                var entity = new PurchaseHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    PriceBot = request.PriceBot,
                    PaymentMethod = request.PaymentMethod,
                    Date = DateTime.UtcNow,
                    StartDate = DateTime.UtcNow,
                    // Nếu request có DurationDays thì cộng vào, nếu logic cũ gửi EndDate thì sửa lại chỗ này
                    EndDate = DateTime.UtcNow.AddDays(request.DurationDays),
                    Status = "Paid"
                };

                await dbContext.purchaseHistories.AddAsync(entity);
                await dbContext.SaveChangesAsync();

                await dbContext.Entry(entity).Reference(x => x.User).LoadAsync();

                return responseSingle.responseObjectSuccess("Thêm thành công", converter.EntityToDTO(entity));
            }
            catch (Exception ex)
            {
                return responseSingle.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 2. UPDATE (Cập nhật - Hồi nãy thiếu cái này)
        // Ông cần tạo Request_UpdatePurchaseHistory tương ứng nhé
        public async Task<ResponseObject<DTO_PurchaseHistory>> UpdatePurchaseHistory(Guid id, Request_AddPurchaseHistory request)
        {
            try
            {
                var entity = await dbContext.purchaseHistories.FindAsync(id);
                if (entity == null) return responseSingle.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy", null);

                // Map dữ liệu cập nhật
                entity.PriceBot = request.PriceBot;
                entity.PaymentMethod = request.PaymentMethod;
                // entity.Status = request.Status; // Nếu trong Request có Status
                // Cập nhật ngày tháng nếu cần...

                dbContext.purchaseHistories.Update(entity);
                await dbContext.SaveChangesAsync();

                // Load User để trả về DTO đầy đủ
                await dbContext.Entry(entity).Reference(x => x.User).LoadAsync();

                return responseSingle.responseObjectSuccess("Cập nhật thành công", converter.EntityToDTO(entity));
            }
            catch (Exception ex)
            {
                return responseSingle.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 3. DELETE (Xóa)
        public async Task<ResponseBase> DeletePurchaseHistory(Guid id)
        {
            try
            {
                var item = await dbContext.purchaseHistories.FindAsync(id);
                if (item == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.purchaseHistories.Remove(item);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        // 4. GET LAST PURCHASE (Lấy đơn hàng cuối cùng của User - Hồi nãy thiếu)
        public async Task<ResponseObject<DTO_PurchaseHistory>> GetLastPurchaseByUser(Guid userId)
        {
            try
            {
                var entity = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.Date) // Sắp xếp ngày mới nhất lên đầu
                    .FirstOrDefaultAsync(); // Lấy thằng đầu tiên (chính là thằng mới nhất)

                if (entity == null) return responseSingle.responseObjectError(StatusCodes.Status404NotFound, "Chưa có giao dịch nào", null);

                return responseSingle.responseObjectSuccess("Lấy giao dịch gần nhất thành công", converter.EntityToDTO(entity));
            }
            catch (Exception ex)
            {
                return responseSingle.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 5. GET ALL (Lấy tất cả)
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetAll()
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();

                var dtos = list.Select(x => converter.EntityToDTO(x)).ToList();
                return responseList.responseObjectSuccess("Lấy danh sách thành công", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 6. GET BY USER (Lấy tất cả của 1 User)
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetByUser(Guid userId)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();

                var dtos = list.Select(x => converter.EntityToDTO(x)).ToList();
                return responseList.responseObjectSuccess("Lấy danh sách của user thành công", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 7. GET MY HISTORY (Tự lấy ID từ Token)
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistory()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                var userIdString = context?.User?.FindFirst("Id")?.Value;

                if (string.IsNullOrEmpty(userIdString))
                    return responseList.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null);

                return await GetByUser(Guid.Parse(userIdString));
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 8. GET HISTORY BY MONTH (Lọc theo tháng của User - Hồi nãy thiếu)
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesMonthByUser(Guid userId, int month, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.UserId == userId && x.Date.Month == month && x.Date.Year == year)
                    .ToListAsync();

                var dtos = list.Select(x => converter.EntityToDTO(x)).ToList();
                return responseList.responseObjectSuccess($"Lịch sử tháng {month}/{year}", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // 9. GET HISTORY BY YEAR (Lọc theo năm của User - Hồi nãy thiếu)
        public async Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesYearByUser(Guid userId, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.UserId == userId && x.Date.Year == year)
                    .ToListAsync();

                var dtos = list.Select(x => converter.EntityToDTO(x)).ToList();
                return responseList.responseObjectSuccess($"Lịch sử năm {year}", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        // --- CÁC HÀM DOANH THU (ADMIN) ---

        private DTO_RevenueResponse CalculateRevenue(List<PurchaseHistory> list)
        {
            return new DTO_RevenueResponse
            {
                TotalRevenue = list.Sum(x => x.PriceBot),
                Purchases = list.Select(x => converter.EntityToDTO(x)).ToList()
            };
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByMonth(int month, int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.Date.Month == month && x.Date.Year == year)
                    .ToListAsync();
                return responseRevenue.responseObjectSuccess($"Doanh thu tháng {month}/{year}", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByYear(int year)
        {
            try
            {
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.Date.Year == year)
                    .ToListAsync();
                return responseRevenue.responseObjectSuccess($"Doanh thu năm {year}", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByDateRange(DateTime from, DateTime to)
        {
            try
            {
                var toDate = to.Date.AddDays(1).AddTicks(-1);
                var list = await dbContext.purchaseHistories
                    .Include(x => x.User)
                    .Where(x => x.Date >= from && x.Date <= toDate)
                    .ToListAsync();
                return responseRevenue.responseObjectSuccess("Doanh thu theo khoảng thời gian", CalculateRevenue(list));
            }
            catch (Exception ex) { return responseRevenue.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }
    }
}