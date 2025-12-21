using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.PurchaseHistory;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_PurchaseHistory
    {
        // 1. Thêm mới
        Task<ResponseObject<DTO_PurchaseHistory>> AddPurchaseHistory(Request_AddPurchaseHistory request);

        // 2. Cập nhật (Hồi nãy thêm vào Service rồi thì Interface phải có)
        Task<ResponseObject<DTO_PurchaseHistory>> UpdatePurchaseHistory(Guid id, Request_AddPurchaseHistory request);

        // 3. Xóa
        Task<ResponseBase> DeletePurchaseHistory(Guid id);

        // 4. Lấy đơn hàng cuối cùng của User
        Task<ResponseObject<DTO_PurchaseHistory>> GetLastPurchaseByUser(Guid userId);

        // 5. Lấy tất cả (Admin)
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetAll();

        // 6. Lấy theo User ID (Admin xem của User)
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetByUser(Guid userId);

        // 7. Lấy lịch sử của chính mình (User tự xem - lấy ID từ Token)
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistory();

        // 8. Lọc lịch sử theo Tháng của User
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesMonthByUser(Guid userId, int month, int year);

        // 9. Lọc lịch sử theo Năm của User
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesYearByUser(Guid userId, int year);

        // --- CÁC HÀM THỐNG KÊ DOANH THU (ADMIN) ---

        // 10. Doanh thu theo Tháng
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByMonth(int month, int year);

        // 11. Doanh thu theo Năm
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByYear(int year);

        // 12. Doanh thu theo khoảng ngày
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByDateRange(DateTime from, DateTime to);
    }
}
