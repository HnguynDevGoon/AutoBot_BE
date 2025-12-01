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
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ResponseObject<ResponsePagination<DTO_WalletTransaction>> responsePagination;

        public Service_WalletTransaction(AppDbContext dbContext, ResponseObject<IList<DTO_WalletTransaction>> responseWalletTransactionList, ResponseObject<DTO_WalletTransaction> responseWalletTransaction, Converter_WalletTransaction converter_WalletTransaction, IHttpContextAccessor httpContextAccessor, ResponseObject<ResponsePagination<DTO_WalletTransaction>> responsePagination)
        {
            this.dbContext = dbContext;
            this.responseWalletTransactionList = responseWalletTransactionList;
            this.responseWalletTransaction = responseWalletTransaction;
            this.converter_WalletTransaction = converter_WalletTransaction;
            _httpContextAccessor = httpContextAccessor;
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

        public async Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> SearchTransactionsByAdmin(Request_SearchTransaction request)
        {
            try
            {
                // 1. Khởi tạo Query (Chưa chạy xuống DB)
                var query = dbContext.walletTransactions
                    .Include(t => t.Wallet)
                    .ThenInclude(w => w.User)
                    .AsQueryable();

                // 2. Bắt đầu lọc (Dynamic Filter)

                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    // 1. Chuẩn hóa & Tách từ
                    var keywords = request.Keyword.Trim().ToLower().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                    // 2. Duyệt qua từng từ khóa và gộp điều kiện (AND)
                    foreach (var k in keywords)
                    {
                        query = query.Where(x =>
                            x.OrderCode.ToString().Contains(k) ||               // Tìm trong Mã đơn
                            x.Description.ToLower().Contains(k) ||              // Tìm trong Mô tả
                            x.Wallet.User.UserName.ToLower().Contains(k) ||     // Tìm theo Username
                            x.Wallet.User.FullName.ToLower().Contains(k)        // Tìm theo Tên thật
                        );
                    }
                }

                // b. Lọc theo Loại giao dịch
                if (!string.IsNullOrWhiteSpace(request.TransactionType))
                {
                    query = query.Where(x => x.TransactionType == request.TransactionType);
                }

                // c. Lọc theo Trạng thái
                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    query = query.Where(x => x.TransactionStatus == request.Status);
                }

                // d. Lọc theo Ngày tháng (FromDate - ToDate)
                if (request.FromDate.HasValue)
                {
                    query = query.Where(x => x.Timestamp >= request.FromDate.Value);
                }
                if (request.ToDate.HasValue)
                {
                    // Lưu ý: ToDate thường phải lấy đến cuối ngày (23:59:59)
                    // Ví dụ: User chọn ngày 01/12, thì phải lấy <= 01/12 23:59:59
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(x => x.Timestamp <= toDate);
                }

                // 3. Tính toán phân trang (Sau khi đã lọc)
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                // 4. Lấy dữ liệu & Sắp xếp
                var transactions = await query
                    .OrderByDescending(t => t.Timestamp) // Mới nhất lên đầu
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                // 5. Convert sang DTO
                var dtoList = transactions.Select(x => converter_WalletTransaction.EntityToDTO(x)).ToList();

                // 6. Đóng gói kết quả
                var paginationData = new ResponsePagination<DTO_WalletTransaction>
                {
                    Items = dtoList,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return responsePagination.responseObjectSuccess("Tìm kiếm thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> SearchMyTransactions(Request_SearchTransaction request)
        {
            try
            {
                // 1. Lấy User ID từ Token
                var context = _httpContextAccessor.HttpContext;
                var userIdString = context?.User?.FindFirst("Id")?.Value;

                if (string.IsNullOrEmpty(userIdString))
                {
                    return responsePagination.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null);
                }
                var userId = Guid.Parse(userIdString);

                // 2. Tìm Ví của User đó
                var wallet = await dbContext.wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                if (wallet == null)
                {
                    return responsePagination.responseObjectError(StatusCodes.Status404NotFound, "Bạn chưa có ví.", null);
                }

                // 3. Khởi tạo Query (CHỈ LẤY TRONG VÍ CỦA MÌNH)
                var query = dbContext.walletTransactions
                    .Include(t => t.Wallet)
                    .ThenInclude(w => w.User) // Vẫn Include để Converter lấy UserName hiển thị cho đẹp
                    .Where(t => t.WalletId == wallet.Id) // <--- CHỐT CHẶN QUAN TRỌNG NHẤT
                    .AsQueryable();

                // 4. Bắt đầu lọc (Logic giống Admin nhưng bỏ phần tìm theo tên User)

                // a. Lọc theo Từ khóa (Thông minh hơn)
                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    var keywords = request.Keyword.Trim().ToLower().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                    foreach (var k in keywords)
                    {
                        query = query.Where(x =>
                            x.OrderCode.ToString().Contains(k) ||
                            x.Description.ToLower().Contains(k)
                        // User search của mình thì không cần search tên User
                        );
                    }
                }

                // b. Loại giao dịch
                if (!string.IsNullOrWhiteSpace(request.TransactionType))
                {
                    query = query.Where(x => x.TransactionType == request.TransactionType);
                }

                // c. Trạng thái
                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    query = query.Where(x => x.TransactionStatus == request.Status);
                }

                // d. Ngày tháng
                if (request.FromDate.HasValue)
                {
                    query = query.Where(x => x.Timestamp >= request.FromDate.Value);
                }
                if (request.ToDate.HasValue)
                {
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(x => x.Timestamp <= toDate);
                }

                // 5. Tính toán phân trang
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                // 6. Lấy dữ liệu & Sắp xếp
                var transactions = await query
                    .OrderByDescending(t => t.Timestamp)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                // 7. Convert & Return
                var dtoList = transactions.Select(x => converter_WalletTransaction.EntityToDTO(x)).ToList();

                var paginationData = new ResponsePagination<DTO_WalletTransaction>
                {
                    Items = dtoList,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return responsePagination.responseObjectSuccess("Tìm kiếm giao dịch thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
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