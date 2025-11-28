using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.WalletTransaction; // Namespace đúng
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
    public class Service_WalletTransaction : IService_WalletTransaction
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseObject<IList<DTO_WalletTransaction>> responseWalletTransactionList;
        private readonly ResponseObject<DTO_WalletTransaction> responseWalletTransaction;
        private readonly Converter_WalletTransaction converter_WalletTransaction;
        private readonly ResponseObject<ResponsePagination<DTO_WalletTransaction>> responsePagination;

        public Service_WalletTransaction(AppDbContext dbContext, ResponseObject<IList<DTO_WalletTransaction>> responseWalletTransactionList, ResponseObject<DTO_WalletTransaction> responseWalletTransaction, Converter_WalletTransaction converter_WalletTransaction, ResponseObject<ResponsePagination<DTO_WalletTransaction>> responsePagination)
        {
            this.dbContext = dbContext;
            this.responseWalletTransactionList = responseWalletTransactionList;
            this.responseWalletTransaction = responseWalletTransaction;
            this.converter_WalletTransaction = converter_WalletTransaction;
            this.responsePagination = responsePagination;
        }



        // 1. LẤY LỊCH SỬ GIAO DỊCH
        public async Task<ResponseObject<IList<DTO_WalletTransaction>>> GetTransactionHistory(Guid userId, int pageNumber, int pageSize)
        {
            try
            {
                // Tìm ví của User trước để lấy WalletId
                var wallet = await dbContext.wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                if (wallet == null)
                {
                    return responseWalletTransactionList.responseObjectError(StatusCodes.Status404NotFound, "Người dùng chưa có ví.", null);
                }

                // Query transaction dựa trên WalletId
                var transactions = await dbContext.walletTransactions
                    .Include(t => t.Wallet)
                    .Where(t => t.WalletId == wallet.Id)
                    .OrderByDescending(t => t.Timestamp) // Mới nhất lên đầu
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Convert sang DTO
                var dtoList = transactions.Select(t => converter_WalletTransaction.EntityToDTO(t)).ToList();

                return responseWalletTransactionList.responseObjectSuccess("Lấy lịch sử giao dịch thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseWalletTransactionList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> GetAllTransactionsAdmin(int pageSize, int pageNumber)
        {
            // 1. Tạo Query
            var query = dbContext.walletTransactions.AsQueryable();

            // 2. Tính toán phân trang
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // 3. Lấy dữ liệu
            var transactions = await query
                .Include(t => t.Wallet)      // Join sang Ví
                .ThenInclude(w => w.User)    // Join sang User (Để Admin biết ai giao dịch)
                .OrderByDescending(t => t.Timestamp) // Mới nhất lên đầu
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 4. Convert sang DTO
            var transactionDtos = transactions.Select(x => converter_WalletTransaction.EntityToDTO(x)).ToList();

            // 5. Đóng gói Dữ liệu (Đây là Data - Cái bánh)
            var paginationData = new ResponsePagination<DTO_WalletTransaction>
            {
                Items = transactionDtos,
                CurrentPage = pageNumber,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            // 6. Trả về Response (Dùng cái Tool đã Inject để bọc Data và Message lại)
            return responsePagination.responseObjectSuccess("Lấy danh sách giao dịch thành công", paginationData);
        }

        // 2. TRỪ TIỀN (Mua Bot / Dịch vụ)
        //public async Task<ResponseObject<DTO_WalletTransaction>> DeductMoney(Request_DeductMoney request)
        //{
        //    try
        //    {
        //        if (request.Amount <= 0)
        //        {
        //            return responseWalletTransaction.responseObjectError(StatusCodes.Status400BadRequest, "Số tiền trừ không hợp lệ.", null);
        //        }

        //        // Tìm ví
        //        var wallet = await dbContext.wallets.FirstOrDefaultAsync(w => w.UserId == request.UserId);
        //        if (wallet == null)
        //        {
        //            return responseWalletTransaction.responseObjectError(StatusCodes.Status404NotFound, "Người dùng chưa có ví.", null);
        //        }

        //        // Kiểm tra số dư
        //        if (wallet.Balance < request.Amount)
        //        {
        //            return responseWalletTransaction.responseObjectError(StatusCodes.Status400BadRequest, "Số dư không đủ để thực hiện giao dịch.", null);
        //        }

        //        // --- THỰC HIỆN TRỪ TIỀN ---
        //        wallet.Balance -= request.Amount;

        //        // Tạo Transaction log
        //        var transaction = new WalletTransaction
        //        {
        //            Id = Guid.NewGuid(),
        //            WalletId = wallet.Id,
        //            Amount = -request.Amount, // Lưu số âm
        //            OrderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss")),
        //            TransactionType = "Trừ tiền",

        //            // --- SỬA: Gán cứng nội dung tại đây ---
        //            Description = "Thanh toán tiền mua Bot",
        //            // --------------------------------------

        //            TransactionStatus = "Thành công",
        //            Timestamp = DateTime.UtcNow
        //        };

        //        await dbContext.walletTransactions.AddAsync(transaction);

        //        // Cập nhật ví
        //        dbContext.wallets.Update(wallet);

        //        await dbContext.SaveChangesAsync();

        //        var dto = converter_WalletTransaction.EntityToDTO(transaction);
        //        return responseWalletTransaction.responseObjectSuccess("Thanh toán thành công.", dto);
        //    }
        //    catch (Exception ex)
        //    {
        //        return responseWalletTransaction.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
        //    }
        //}

    }
}