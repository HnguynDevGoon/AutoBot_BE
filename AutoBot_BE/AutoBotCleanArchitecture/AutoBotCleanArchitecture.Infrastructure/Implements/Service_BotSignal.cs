using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory; // Dùng cái gốc của Microsoft luôn
using System.Globalization;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_BotSignal : IService_BotSignal
    {
        private readonly AppDbContext _dbContext;
        private readonly Converter_BotSignal _converter;
        private readonly IMemoryCache _memoryCache; // <--- Xài hàng chính chủ, khỏi tạo Interface lạ
        private readonly ResponseBase _responseBase;
        private readonly ResponseObject<string> _responseString;
        private readonly ResponseObject<List<DTO_BotSignal>> _responseList;

        public Service_BotSignal(
            AppDbContext dbContext,
            Converter_BotSignal converter,
            IMemoryCache memoryCache,
            ResponseBase responseBase,
            ResponseObject<string> responseString,
            ResponseObject<List<DTO_BotSignal>> responseList)
        {
            _dbContext = dbContext;
            _converter = converter;
            _memoryCache = memoryCache;
            _responseBase = responseBase;
            _responseString = responseString;
            _responseList = responseList;
        }

        public ResponseObject<string> CacheSignal(string rawText)
        {
            try
            {
                var message = rawText.Split('\n');
                var signalType = message[1].Trim().Contains("long") ? "LONG" : "SHORT";

                var now = TimeOnly.FromDateTime(DateTime.Now);
                var noon = new TimeOnly(12, 00);

                string sessionKey = (now < noon) ? "Morning" : "Afternoon";

                string finalMessage = rawText;

                if (_memoryCache.TryGetValue(sessionKey, out string oldSignal))
                {
                    if (!string.IsNullOrEmpty(oldSignal) && oldSignal != signalType)
                    {
                        finalMessage += "\nREVERSE";
                    }
                }

                _memoryCache.Set(sessionKey, signalType, TimeSpan.FromHours(3));

                return _responseString.responseObjectSuccess("Cache thành công", finalMessage);
            }
            catch
            {
                return _responseString.responseObjectSuccess("Lỗi cache", rawText);
            }
        }

        public async Task<ResponseBase> AddSignal(string rawText)
        {
            try
            {
                var message = rawText.Split('\n');
                var dateParts = message[0].Trim().Split(" ");
                var datetimeStr = dateParts[2] + " " + dateParts[3];
                var signalType = message[1].Trim().Contains("long") ? "LONG" : "SHORT";
                var priceStr = message[2].Trim().Split(":")[1].Trim();

                var entity = new BotSignal
                {
                    Id = Guid.NewGuid(),
                    DateTime = DateTime.ParseExact(datetimeStr, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    Signal = signalType,
                    Price = double.Parse(priceStr)
                };

                await _dbContext.botSignals.AddAsync(entity);
                await _dbContext.SaveChangesAsync();

                return _responseBase.ResponseSuccess("Lưu DB thành công");
            }   
            catch (Exception ex)
            {
                return _responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        public async Task<ResponseObject<List<DTO_BotSignal>>> GetSignals()
        {
            try
            {
                var list = await _dbContext.botSignals.OrderByDescending(x => x.DateTime).Take(10).ToListAsync();
                var dtos = list.Select(x => _converter.EntityToDTO(x)).ToList();
                return _responseList.responseObjectSuccess("Thành công", dtos);
            }
            catch (Exception ex) { return _responseList.responseObjectError(500, ex.Message, null); }
        }
    }
}