using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ProfitLoss;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_ProfitLoss : IService_ProfitLoss
    {
        private readonly AppDbContext dbContext;
        private readonly Converter_ProfitLoss converter_ProfitLoss;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<DTO_ProfitLoss> responseObject;
        private readonly ResponseObject<List<DTO_ProfitLoss>> responseObjectList;

        public Service_ProfitLoss(
            AppDbContext dbContext,
            Converter_ProfitLoss converter_ProfitLoss,
            ResponseBase responseBase,
            ResponseObject<DTO_ProfitLoss> responseObject,
            ResponseObject<List<DTO_ProfitLoss>> responseObjectList)
        {
            this.dbContext = dbContext;
            this.converter_ProfitLoss = converter_ProfitLoss;
            this.responseBase = responseBase;
            this.responseObject = responseObject;
            this.responseObjectList = responseObjectList;
        }

        public async Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLosses(int pageNumber, int pageSize)
        {
            try
            {
                if (pageNumber < 1) pageNumber = 1;

                var query = dbContext.profitLosses
                    .Include(p => p.User)
                    .OrderByDescending(p => p.Date);

                var profitLosses = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var dtoList = profitLosses.Select(x => converter_ProfitLoss.EntityToDTO(x)).ToList();

                return responseObjectList.responseObjectSuccess($"Lấy danh sách trang {pageNumber} thành công", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_ProfitLoss>> CreateProfitLoss(Request_CreateProfitLoss request)
        {
            try
            {
                var entity = new ProfitLoss
                {
                    Price = request.Price,
                    Date = request.Date,
                    UserId = request.UserId,
                };

                await dbContext.profitLosses.AddAsync(entity);
                await dbContext.SaveChangesAsync();

                var result = await dbContext.profitLosses
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == entity.Id);

                var dto = converter_ProfitLoss.EntityToDTO(result);
                return responseObject.responseObjectSuccess("Tạo mới thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_ProfitLoss>> UpdateProfitLoss(Request_UpdateProfitLoss request)
        {
            try
            {
                var existingEntity = await dbContext.profitLosses.FindAsync(request.Id);
                if (existingEntity == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy", null);
                }

                existingEntity.Price = request.Price;
                existingEntity.Date = request.Date;
                existingEntity.UserId = request.UserId;

                dbContext.profitLosses.Update(existingEntity);
                await dbContext.SaveChangesAsync();

                var dto = converter_ProfitLoss.EntityToDTO(existingEntity);
                return responseObject.responseObjectSuccess("Cập nhật thành công", dto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseBase> DeleteProfitLoss(Guid id)
        {
            try
            {
                var entity = await dbContext.profitLosses.FindAsync(id);
                if (entity == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy");
                }

                dbContext.profitLosses.Remove(entity);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Xóa thành công");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByDay(int day, int month, int year, Guid userId)
        {
            try
            {
                var result = await dbContext.profitLosses
                    .Include(p => p.User)
                    .Where(pl => pl.Date.Day == day && pl.Date.Month == month && pl.Date.Year == year && pl.UserId == userId)
                    .ToListAsync();

                var dtoList = result.Select(x => converter_ProfitLoss.EntityToDTO(x)).ToList();
                var total = dtoList.Sum(x => x.Price);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu thành công. Tổng: {total}", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByMonth(int month, int year, Guid userId)
        {
            try
            {
                var result = await dbContext.profitLosses
                    .Include(p => p.User)
                    .Where(pl => pl.Date.Month == month && pl.Date.Year == year && pl.UserId == userId)
                    .ToListAsync();

                var dtoList = result.Select(x => converter_ProfitLoss.EntityToDTO(x)).ToList();
                var total = dtoList.Sum(x => x.Price);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu thành công. Tổng: {total}", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossByYear(int year, Guid userId)
        {
            try
            {
                var result = await dbContext.profitLosses
                    .Include(p => p.User)
                    .Where(pl => pl.Date.Year == year && pl.UserId == userId)
                    .ToListAsync();

                var dtoList = result.Select(x => converter_ProfitLoss.EntityToDTO(x)).ToList();
                var total = dtoList.Sum(x => x.Price);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu thành công. Tổng: {total}", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<List<DTO_ProfitLoss>>> GetProfitLossAll(Guid userId)
        {
            try
            {
                var result = await dbContext.profitLosses
                    .Include(p => p.User)
                    .Where(pl => pl.UserId == userId)
                    .ToListAsync();

                var dtoList = result.Select(x => converter_ProfitLoss.EntityToDTO(x)).ToList();
                var total = dtoList.Sum(x => x.Price);

                return responseObjectList.responseObjectSuccess($"Lấy dữ liệu thành công. Tổng: {total}", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}