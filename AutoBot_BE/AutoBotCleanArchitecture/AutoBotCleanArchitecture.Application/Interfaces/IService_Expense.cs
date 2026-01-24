using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Expense;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Expense
    {
        Task<ResponseObject<ResponsePagination<DTO_Expense>>> GetExpenses(int pageNumber, int pageSize);
        Task<ResponseObject<DTO_Expense>> AddExpense(Request_AddExpense request);
        Task<ResponseObject<DTO_Expense>> UpdateExpense(Request_UpdateExpense request);
        Task<ResponseBase> DeleteExpense(Guid id);
        Task<ResponseObject<List<DTO_Expense>>> GetExpenseByDate(int day, int month, int year);
        Task<ResponseObject<List<DTO_Expense>>> GetExpenseByMonth(int month, int year);
        Task<ResponseObject<List<DTO_Expense>>> GetExpenseByYear(int year);
        Task<ResponseObject<List<DTO_Expense>>> GetExpenseDate(DateTime from, DateTime to);
    }
}