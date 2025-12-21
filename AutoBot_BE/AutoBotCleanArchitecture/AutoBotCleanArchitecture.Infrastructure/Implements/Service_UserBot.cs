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

        public Service_UserBot(
            AppDbContext dbContext,
            ResponseBase responseBase,
            ResponseObject<List<DTO_UserBot>> responseList,
            Converter_UserBot converter) 
        {
            this.dbContext = dbContext;
            this.responseBase = responseBase;
            this.responseList = responseList;
            this.converter = converter;
        }

        public async Task<ResponseBase> AddUserBot(Request_AddUserBot request)
        {
            try
            {
                var userExists = await dbContext.users.AnyAsync(x => x.Id == request.UserId);
                if (!userExists) return responseBase.ResponseError(StatusCodes.Status404NotFound, "User không tồn tại.");

                var botExists = await dbContext.botTradings.AnyAsync(x => x.Id == request.BotTradingId);
                if (!botExists) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Bot không tồn tại.");

                var exists = await dbContext.userBots
                    .AnyAsync(x => x.UserId == request.UserId && x.BotTradingId == request.BotTradingId);

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
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseBase> DeleteUserBot(Guid userId, Guid botTradingId)
        {
            try
            {
                var item = await dbContext.userBots
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.BotTradingId == botTradingId);

                if (item == null) return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không tìm thấy.");

                dbContext.userBots.Remove(item);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Hủy đăng ký thành công.");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseObject<List<DTO_UserBot>>> GetUserBots()
        {
            try
            {
                var entities = await dbContext.userBots
                    .Include(x => x.User)
                    .Include(x => x.BotTrading)
                    .ToListAsync();

                var dtos = entities.Select(x => converter.EntityToDTO(x)).ToList();

                return responseList.responseObjectSuccess("Lấy danh sách thành công", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<bool> ExistUserBot(Guid userId, Guid botTradingId)
        {
            return await dbContext.userBots.AnyAsync(x => x.UserId == userId && x.BotTradingId == botTradingId);
        }
    }
}