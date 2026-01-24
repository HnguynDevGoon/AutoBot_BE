using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.Salary;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Salary
    {
        Task<ResponseObject<ResponsePagination<DTO_Salary>>> GetSalaries(int pageNumber, int pageSize);
        Task<ResponseObject<DTO_Salary>> AddSalary(Request_AddSalary request);
        Task<ResponseObject<DTO_Salary>> UpdateSalary(Request_UpdateSalary request);
        Task<ResponseBase> DeleteSalary(int month, int year, Guid userId);
        Task<ResponseObject<List<DTO_Salary>>> GetSalaryByMonth(int month, int year);
        Task<ResponseObject<List<DTO_Salary>>> GetSalaryByYear(int year);
        Task<ResponseObject<List<DTO_Salary>>> GetSalaryDate(DateTime from, DateTime to);
    }
}