using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Expense;
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
    public class Service_Expense : IService_Expense
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_Expense converter_Expense;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_Expense> responseObject;
        private readonly ResponseObject<List<DTO_Expense>> responseObjectList;
        private readonly ResponseObject<ResponsePagination<DTO_Expense>> _responsePagination;

        public Service_Expense(
            AppDbContext dbContext,
            Converter_Expense converter_Expense,
            ResponseBase responseBase,
            ResponseObject<DTO_Expense> responseObject,
            ResponseObject<List<DTO_Expense>> responseObjectList,
            ResponseObject<ResponsePagination<DTO_Expense>> responsePagination)
        {
            this.dbContext = dbContext;
            this.converter_Expense = converter_Expense;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.responseObjectList = responseObjectList;
            this._responsePagination = responsePagination;
        }

        public async Task<ResponseObject<ResponsePagination<DTO_Expense>>> GetExpenses(int pageNumber, int pageSize)
        {
            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = dbContext.expenses.OrderByDescending(x => x.Date).AsQueryable();

                var totalItems = await query.CountAsync();
                var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
                var dtos = items.Select(x => converter_Expense.EntityToDTO(x)).ToList();
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                var result = new ResponsePagination<DTO_Expense>
                {
                    Items = dtos,
                    CurrentPage = pageNumber,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return _responsePagination.responseObjectSuccess("Lấy danh sách thành công", result);
            }
            catch (Exception ex) { return _responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_Expense>> AddExpense(Request_AddExpense request)
        {
            try
            {
                var entity = new Expense
                {
                    Name = request.Name,
                    Price = request.Price,
                    Date = request.Date,
                    Description = request.Description
                };

                await dbContext.expenses.AddAsync(entity);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Thêm chi tiêu thành công", converter_Expense.EntityToDTO(entity));
            }
            catch (Exception ex) { return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_Expense>> UpdateExpense(Request_UpdateExpense request)
        {
            try
            {
                var entity = await dbContext.expenses.FindAsync(request.Id);
                if (entity == null) return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy chi tiêu", null);

                entity.Name = request.Name;
                entity.Price = request.Price;
                entity.Date = request.Date;
                entity.Description = request.Description;

                await dbContext.SaveChangesAsync();
                return responseObject.responseObjectSuccess("Cập nhật thành công", converter_Expense.EntityToDTO(entity));
            }
            catch (Exception ex) { return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        // 4. DELETE
        public async Task<ResponseBase> DeleteExpense(Guid id)
        {
            try
            {
                var entity = await dbContext.expenses.FindAsync(id);
                if (entity == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.expenses.Remove(entity);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }

        // 5. GET BY DATE (DAY/MONTH/YEAR)
        public async Task<ResponseObject<List<DTO_Expense>>> GetExpenseByDate(int day, int month, int year)
        {
            try
            {
                var list = await dbContext.expenses.Where(x => x.Date.Day == day && x.Date.Month == month && x.Date.Year == year).ToListAsync();
                var total = list.Sum(x => x.Price);
                return responseObjectList.responseObjectSuccess($"Chi tiêu ngày {day}/{month}/{year}. Tổng: {total:#,##0}", list.Select(x => converter_Expense.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_Expense>>> GetExpenseByMonth(int month, int year)
        {
            try
            {
                var list = await dbContext.expenses.Where(x => x.Date.Month == month && x.Date.Year == year).ToListAsync();
                var total = list.Sum(x => x.Price);
                return responseObjectList.responseObjectSuccess($"Chi tiêu tháng {month}/{year}. Tổng: {total:#,##0}", list.Select(x => converter_Expense.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_Expense>>> GetExpenseByYear(int year)
        {
            try
            {
                var list = await dbContext.expenses.Where(x => x.Date.Year == year).ToListAsync();
                var total = list.Sum(x => x.Price);
                return responseObjectList.responseObjectSuccess($"Chi tiêu năm {year}. Tổng: {total:#,##0}", list.Select(x => converter_Expense.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_Expense>>> GetExpenseDate(DateTime from, DateTime to)
        {
            try
            {
                var list = await dbContext.expenses.Where(x => x.Date >= from && x.Date <= to).ToListAsync();
                var total = list.Sum(x => x.Price);
                return responseObjectList.responseObjectSuccess($"Từ {from:dd/MM} đến {to:dd/MM}. Tổng: {total:#,##0}", list.Select(x => converter_Expense.EntityToDTO(x)).ToList());
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }
    }
}