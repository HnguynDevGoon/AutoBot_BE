using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.WalletTransaction;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_WalletTransaction
    {
        Task<ResponseObject<IList<DTO_WalletTransaction>>> GetTransactionHistory(Guid userId, int pageNumber, int pageSize);
        Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> GetAllTransactionsAdmin(int pageSize, int pageNumber);
        Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> SearchTransactionsByAdmin(Request_SearchTransaction request);
        Task<ResponseObject<ResponsePagination<DTO_WalletTransaction>>> SearchMyTransactions(Request_SearchTransaction request);

        //Task<ResponseObject<DTO_WalletTransaction>> DeductMoney(Request_DeductMoney request);
    }
}
