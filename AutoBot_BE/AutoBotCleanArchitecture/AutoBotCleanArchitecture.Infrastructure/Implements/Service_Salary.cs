using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Salary;
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
    public class Service_Salary : IService_Salary
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_Salary converter_Salary;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_Salary> responseObject;
        private readonly ResponseObject<List<DTO_Salary>> responseObjectList;
        private readonly ResponseObject<ResponsePagination<DTO_Salary>> _responsePagination;

        public Service_Salary(
            AppDbContext dbContext,
            Converter_Salary converter_Salary,
            ResponseBase responseBase,
            ResponseObject<DTO_Salary> responseObject,
            ResponseObject<List<DTO_Salary>> responseObjectList,
            ResponseObject<ResponsePagination<DTO_Salary>> responsePagination)
        {
            this.dbContext = dbContext;
            this.converter_Salary = converter_Salary;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.responseObjectList = responseObjectList;
            this._responsePagination = responsePagination;
        }

        public async Task<ResponseObject<ResponsePagination<DTO_Salary>>> GetSalaries(int pageNumber, int pageSize)
        {
            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = dbContext.salaries
                    .Include(s => s.User)
                    .OrderByDescending(s => s.Year).ThenByDescending(s => s.Month)
                    .AsQueryable();

                var totalItems = await query.CountAsync();
                var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
                var dtos = items.Select(s => converter_Salary.EntityToDTO(s)).ToList();
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                var result = new ResponsePagination<DTO_Salary>
                {
                    Items = dtos,
                    CurrentPage = pageNumber,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return _responsePagination.responseObjectSuccess("Lấy danh sách phân trang thành công", result);
            }
            catch (Exception ex) { return _responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<DTO_Salary>> AddSalary(Request_AddSalary request)
        {
            try
            {
                var exists = await dbContext.salaries.AnyAsync(s => s.Month == request.Month && s.Year == request.Year && s.UserId == request.UserId);
                if (exists) return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Lương đã tồn tại!", null);

                var entity = new Salary
                {
                    Month = request.Month,
                    Year = request.Year,
                    UserId = request.UserId,
                    Price = request.Price,
                    Bonus = request.Bonus,
                    Description = request.Description
                };

                await dbContext.salaries.AddAsync(entity);
                await dbContext.SaveChangesAsync();
                await dbContext.Entry(entity).Reference(x => x.User).LoadAsync();

                return responseObject.responseObjectSuccess("Thêm thành công", converter_Salary.EntityToDTO(entity));
            }
            catch (Exception ex) { return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseBase> DeleteSalary(int month, int year, Guid userId)
        {
            try
            {
                var salary = await dbContext.salaries.FirstOrDefaultAsync(s => s.Month == month && s.Year == year && s.UserId == userId);
                if (salary == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.salaries.Remove(salary);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }

        public async Task<ResponseObject<DTO_Salary>> UpdateSalary(Request_UpdateSalary request)
        {
            try
            {
                var existingSalary = await dbContext.salaries
                    .FirstOrDefaultAsync(s => s.Month == request.Month &&
                                              s.Year == request.Year &&
                                              s.UserId == request.UserId);

                if (existingSalary == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy bảng lương để cập nhật.", null);
                }

                existingSalary.Price = request.Price;
                existingSalary.Bonus = request.Bonus;
                existingSalary.Description = request.Description;

                await dbContext.SaveChangesAsync();

                var dto = converter_Salary.EntityToDTO(existingSalary);
                return responseObject.responseObjectSuccess("Cập nhật thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<List<DTO_Salary>>> GetSalaryByMonth(int month, int year)
        {
            try
            {
                var list = await dbContext.salaries
                    .Include(s => s.User)
                    .Where(sa => sa.Month == month && sa.Year == year)
                    .ToListAsync();

                var dtos = list.Select(e => converter_Salary.EntityToDTO(e)).ToList();
                var total = dtos.Sum(s => s.Price + s.Bonus);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu tháng {month}/{year} thành công. Tổng chi: {total:#,##0}", dtos);
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_Salary>>> GetSalaryByYear(int year)
        {
            try
            {
                var list = await dbContext.salaries
                    .Include(s => s.User)
                    .Where(sa => sa.Year == year)
                    .ToListAsync();

                var dtos = list.Select(e => converter_Salary.EntityToDTO(e)).ToList();
                var total = dtos.Sum(s => s.Price + s.Bonus);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu năm {year} thành công. Tổng chi: {total:#,##0}", dtos);
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }

        public async Task<ResponseObject<List<DTO_Salary>>> GetSalaryDate(DateTime from, DateTime to)
        {
            try
            {
                var list = await dbContext.salaries
                    .Include(s => s.User)
                    .Where(sa => (sa.Year > from.Year || (sa.Year == from.Year && sa.Month >= from.Month)) &&
                                 (sa.Year < to.Year || (sa.Year == to.Year && sa.Month <= to.Month)))
                    .ToListAsync();

                var dtos = list.Select(e => converter_Salary.EntityToDTO(e)).ToList();
                var total = dtos.Sum(s => s.Price + s.Bonus);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu từ {from:MM/yyyy} đến {to:MM/yyyy} thành công. Tổng chi: {total:#,##0}", dtos);
            }
            catch (Exception ex) { return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }
    }
}