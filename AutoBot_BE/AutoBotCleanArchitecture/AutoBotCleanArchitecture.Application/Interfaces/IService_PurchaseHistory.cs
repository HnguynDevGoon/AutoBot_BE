using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_PurchaseHistory
    {
        // =======================================================
        // 1. GROUP USER (CÁ NHÂN - TOKEN)
        // =======================================================
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistoryByMonth(int month, int year);
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyHistoryByYear(int year);
        Task<ResponseObject<double>> GetTotalSpentOnBots();
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetMyBoughtBots();
        Task<ResponseObject<ResponsePagination<DTO_PurchaseHistory>>> GetMyHistoryDynamic(string? orderType, string? paymentMethod, int pageSize, int pageNumber);


        // =======================================================
        // 2. GROUP ADMIN (QUẢN TRỊ - CẦN USERID)
        // =======================================================
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetNewestTransactionForAdmin();
        Task<ResponseBase> DeletePurchaseHistory(Guid id);

        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetAll();

        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetByUser(Guid userId);
        Task<ResponseObject<ResponsePagination<DTO_PurchaseHistory>>> GetAllHistoryDynamicForAdmin(string? orderType, string? paymentMethod, string? searchKeyword, int pageSize, int pageNumber);

        // --- [ĐÂY NÈ, ÔNG ĐANG THIẾU 3 DÒNG NÀY NÊN NÓ BÁO LỖI NÈ] ---

        // 1. Admin lấy đơn cuối của khách
        Task<ResponseObject<DTO_PurchaseHistory>> GetLastPurchaseByUser(Guid userId);

        // 2. Admin lọc tháng của khách
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesMonthByUser(Guid userId, int month, int year);

        // 3. Admin lọc năm của khách
        Task<ResponseObject<List<DTO_PurchaseHistory>>> GetPurchaseHistoriesYearByUser(Guid userId, int year);

        // ----------------------------------------------------------------


        // =======================================================
        // 3. GROUP THỐNG KÊ DOANH THU
        // =======================================================
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByMonth(int month, int year);
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByYear(int year);
        Task<ResponseObject<DTO_RevenueResponse>> GetRevenueByDateRange(DateTime from, DateTime to);
    }
}