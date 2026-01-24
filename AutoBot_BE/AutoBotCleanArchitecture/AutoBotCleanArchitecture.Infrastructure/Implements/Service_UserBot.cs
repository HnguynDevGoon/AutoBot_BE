using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.UserBot;
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
    public class Service_UserBot : IService_UserBot
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<List<DTO_UserBot>> responseList;
        private readonly Converter_UserBot converter;
        private readonly ResponseObject<DTO_UserBot> responseObject;
        private readonly ResponseObject<ResponsePagination<DTO_UserBot>> _responsePagination;

        public Service_UserBot(
            AppDbContext dbContext,
            ResponseBase responseBase,
            ResponseObject<List<DTO_UserBot>> responseList,
            Converter_UserBot converter,
            ResponseObject<DTO_UserBot> responseObject,
            ResponseObject<ResponsePagination<DTO_UserBot>> responsePagination)
        {
            this.dbContext = dbContext;
            this.responseBase = responseBase;
            this.responseList = responseList;
            this.converter = converter;
            this.responseObject = responseObject;
            this._responsePagination = responsePagination;
        }

        public async Task<ResponseObject<ResponsePagination<DTO_UserBot>>> GetUserBots(int pageNumber, int pageSize)
        {
            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = dbContext.userBots
                    .Include(x => x.User)
                    .Include(x => x.BotTrading)
                    .AsQueryable();

                var totalItems = await query.CountAsync();
                var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

                // Nhớ update Converter map thêm Id nhé
                var dtos = items.Select(x => converter.EntityToDTO(x)).ToList();
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                var result = new ResponsePagination<DTO_UserBot>
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
        public async Task<ResponseObject<DTO_UserBot>> GetUserBotById(Guid id)
        {
            try
            {
                var item = await dbContext.userBots
                    .Include(x => x.User)
                    .Include(x => x.BotTrading)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (item == null) return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy.", null);

                return responseObject.responseObjectSuccess("Thành công", converter.EntityToDTO(item));
            }
            catch (Exception ex) { return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null); }
        }
        public async Task<ResponseBase> AddUserBot(Request_AddUserBot request)
        {
            try
            {
                var userExists = await dbContext.users.AnyAsync(x => x.Id == request.UserId);
                if (!userExists) return responseBase.ResponseError(StatusCodes.Status404NotFound, "User không tồn tại.");

                var botExists = await dbContext.botTradings.AnyAsync(x => x.Id == request.BotTradingId);
                if (!botExists) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Bot không tồn tại.");

                var exists = await dbContext.userBots.AnyAsync(x => x.UserId == request.UserId && x.BotTradingId == request.BotTradingId);
                if (exists) return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Đã đăng ký rồi.");

                var entity = new UserBot
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    BotTradingId = request.BotTradingId
                };

                await dbContext.userBots.AddAsync(entity);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Đăng ký thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }

        public async Task<ResponseBase> UpdateUserBot(Request_UpdateUserBot request)
        {
            try
            {
                var entity = await dbContext.userBots.FindAsync(request.Id);
                if (entity == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy dữ liệu.");

                // Check trùng lặp (trừ chính nó ra)
                bool isDuplicate = await dbContext.userBots.AnyAsync(x => x.Id != request.Id && x.UserId == request.UserId && x.BotTradingId == request.BotTradingId);
                if (isDuplicate) return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Cặp User-Bot này đã tồn tại.");

                entity.UserId = request.UserId;
                entity.BotTradingId = request.BotTradingId;

                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Cập nhật thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }

        public async Task<ResponseBase> DeleteUserBot(Guid id)
        {
            try
            {
                var item = await dbContext.userBots.FindAsync(id);
                if (item == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.userBots.Remove(item);
                await dbContext.SaveChangesAsync();
                return responseBase.ResponseSuccess("Xóa thành công.");
            }
            catch (Exception ex) { return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message); }
        }
    }
}