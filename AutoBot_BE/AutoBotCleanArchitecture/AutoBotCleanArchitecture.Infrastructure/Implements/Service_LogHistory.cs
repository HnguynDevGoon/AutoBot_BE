using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.LogHistory;
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
    public class Service_LogHistory : IService_LogHistory
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseObject<DTO_LogHistory> responseObjectLogHistory;
        private readonly ResponseObject<IList<DTO_LogHistory>> responseObjectLogHistoryList;
        private readonly Converter_LogHistory converter_LogHistory;
        private readonly ResponseBase responseBase;

        public Service_LogHistory(
            AppDbContext dbContext,
            ResponseObject<DTO_LogHistory> responseObjectLogHistory,
            ResponseObject<IList<DTO_LogHistory>> responseObjectLogHistoryList,
            Converter_LogHistory converter_LogHistory,
            ResponseBase responseBase)
        {
            this.dbContext = dbContext;
            this.responseObjectLogHistory = responseObjectLogHistory;
            this.responseObjectLogHistoryList = responseObjectLogHistoryList;
            this.converter_LogHistory = converter_LogHistory;
            this.responseBase = responseBase;
        }

        public async Task<ResponseObject<DTO_LogHistory>> AddLogHistory(Request_LogHistory request)
        {
            try
            {
                var _logHistory = new LogHistory
                {
                    Signal = request.Signal,
                    DateTime = request.DateTime,
                    IsSL = request.IsSL,
                    ProfitPointTP = request.ProfitPointTP,
                    NumberContract = request.NumberContract,
                    PriceBuy = request.PriceBuy,
                    UserId = request.UserId,
                    Profit = 0,
                };
                if (request.Signal == "LONG")
                {
                    _logHistory.Profit = Math.Round(request.NumberContract * (request.ProfitPointTP - request.PriceBuy) * 100000);
                }
                else if (request.Signal == "SHORT")
                {
                    _logHistory.Profit = Math.Round(request.NumberContract * (request.PriceBuy - request.ProfitPointTP) * 100000);
                }

                await dbContext.logHistories.AddAsync(_logHistory);
                await dbContext.SaveChangesAsync();

                if (_logHistory.UserId.HasValue)
                {
                    await dbContext.Entry(_logHistory).Reference(x => x.User).LoadAsync();
                }

                var dto = converter_LogHistory.EntityToDTO(_logHistory);
                return responseObjectLogHistory.responseObjectSuccess("Thêm log thành công.", dto);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistory.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi khi thêm log: {ex.Message}", default);
            }
        }

        public async Task<bool> DeleteLogHistory(Guid id)
        {
            var _logHistory = await dbContext.logHistories.FindAsync(id);
            if (_logHistory != null)
            {
                dbContext.Remove(_logHistory);
                await dbContext.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistory()
        {
            try
            {
                var result = await dbContext.logHistories
                    .Include(lh => lh.User)
                    .OrderByDescending(p => p.DateTime)
                    .ToListAsync();

                var dtoList = result.Select(lh => converter_LogHistory.EntityToDTO(lh)).ToList();
                return responseObjectLogHistoryList.responseObjectSuccess("Lấy danh sách log thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistoryList.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi: {ex.Message}", default);
            }
        }

        public async Task<ResponseObject<DTO_LogHistory>> UpdateLogHistory(Guid id, Request_LogHistory request)
        {
            try
            {
                var _logHistory = await dbContext.logHistories.FindAsync(id);
                if (_logHistory == null)
                {
                    return responseObjectLogHistory.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy log để cập nhật.", default);
                }

                _logHistory.IsSL = request.IsSL;
                _logHistory.NumberContract = request.NumberContract;
                _logHistory.PriceBuy = request.PriceBuy;
                _logHistory.Signal = request.Signal;
                _logHistory.ProfitPointTP = request.ProfitPointTP;
                _logHistory.UserId = request.UserId;
                _logHistory.DateTime = request.DateTime;
                _logHistory.Profit = request.NumberContract * (request.ProfitPointTP - request.PriceBuy);


                if (request.Signal == "LONG")
                {
                    _logHistory.Profit = Math.Round(request.NumberContract * (request.ProfitPointTP - request.PriceBuy) * 100000);
                }
                else if (request.Signal == "SHORT")
                {
                    _logHistory.Profit = Math.Round(request.NumberContract * (request.PriceBuy - request.ProfitPointTP) * 100000);
                }

                await dbContext.SaveChangesAsync();

                if (_logHistory.UserId.HasValue)
                {
                    await dbContext.Entry(_logHistory).Reference(x => x.User).LoadAsync();
                }

                var dto = converter_LogHistory.EntityToDTO(_logHistory);
                return responseObjectLogHistory.responseObjectSuccess("Cập nhật log thành công.", dto);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistory.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi khi cập nhật log: {ex.Message}", default);
            }
        }

        public async Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryDay(int day, int month, int year, Guid userId)
        {
            try
            {
                var result = await dbContext.logHistories
                    .Include(lh => lh.User)
                    .Where(lh =>
                        lh.DateTime.Day == day && lh.DateTime.Month == month && lh.DateTime.Year == year
                        && lh.UserId == userId
                    )
                    .OrderByDescending(p => p.DateTime)
                    .ToListAsync();

                var dtoList = result.Select(lh => converter_LogHistory.EntityToDTO(lh)).ToList();
                return responseObjectLogHistoryList.responseObjectSuccess("Lấy log theo ngày thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistoryList.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi: {ex.Message}", default);
            }
        }

        public async Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryMonth(int month, int year, Guid userId)
        {
            try
            {
                var result = await dbContext.logHistories
                    .Include(lh => lh.User)
                    .Where(lh =>
                        lh.DateTime.Month == month && lh.DateTime.Year == year
                        && lh.UserId == userId
                    )
                    .OrderByDescending(p => p.DateTime)
                    .ToListAsync();

                var dtoList = result.Select(lh => converter_LogHistory.EntityToDTO(lh)).ToList();
                return responseObjectLogHistoryList.responseObjectSuccess("Lấy log theo tháng thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistoryList.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi: {ex.Message}", default);
            }
        }

        public async Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryYear(int year, Guid userId)
        {
            try
            {
                var result = await dbContext.logHistories
                    .Include(lh => lh.User)
                    .Where(lh =>
                        lh.DateTime.Year == year && lh.UserId == userId
                    )
                    .OrderByDescending(p => p.DateTime)
                    .ToListAsync();

                var dtoList = result.Select(lh => converter_LogHistory.EntityToDTO(lh)).ToList();
                return responseObjectLogHistoryList.responseObjectSuccess("Lấy log theo năm thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistoryList.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi: {ex.Message}", default);
            }
        }

        public async Task<ResponseObject<IList<DTO_LogHistory>>> GetLogHistoryById(Guid userId)
        {
            try
            {
                var result = await dbContext.logHistories
                    .Include(lh => lh.User)
                    .Where(lh => lh.UserId == userId)
                    .OrderByDescending(p => p.DateTime)
                    .ToListAsync();

                var dtoList = result.Select(lh => converter_LogHistory.EntityToDTO(lh)).ToList();
                return responseObjectLogHistoryList.responseObjectSuccess("Lấy tất cả log theo user thành công.", dtoList);
            }
            catch (Exception ex)
            {
                return responseObjectLogHistoryList.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi: {ex.Message}", default);
            }
        }
    }
}