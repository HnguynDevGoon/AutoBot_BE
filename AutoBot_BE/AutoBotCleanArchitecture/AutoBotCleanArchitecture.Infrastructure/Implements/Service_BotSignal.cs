using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

public class Service_BotSignal : IService_BotSignal
{
    private readonly AppDbContext dbContext;
    private readonly Converter_BotSignal converter;
    private readonly IMemoryCache memoryCache;
    private readonly ResponseObject<List<DTO_BotSignal>> responseObjectList;
    private readonly ResponseBase responseBase;

    public Service_BotSignal(
        AppDbContext dbContext,
        Converter_BotSignal converter,
        IMemoryCache memoryCache,
        ResponseObject<List<DTO_BotSignal>> responseObjectList,
        ResponseBase responseBase)
    {
        this.dbContext = dbContext;
        this.converter = converter;
        this.memoryCache = memoryCache;
        this.responseObjectList = responseObjectList;
        this.responseBase = responseBase;
    }

    // 1. Thêm tín hiệu - Bóc tách chuỗi theo đúng format của người ta
    public async Task<ResponseBase> AddSignal(string text)
    {
        try
        {
            var message = text.Split('\n');

            // Lấy chuỗi ngày tháng: message[0] là "Date: 2025-12-25 18:00:00" chẳng hạn
            var datetimeParts = message[0].Trim().Split(" ");
            var datetimeStr = datetimeParts[2] + " " + datetimeParts[3];

            var tinhieu = message[1].Trim().Contains("Manh") ? "LONG" : "SHORT";
            var gia = message[2].Trim().Split(":")[1].Trim();

            // Logic Cache để check đảo chiều (Reverse)
            CacheSignal(tinhieu);

            var signal = new BotSignal
            {
                Signal = tinhieu,
                Price = double.Parse(gia),
                DateTime = DateTime.ParseExact(datetimeStr, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)
            };

            await dbContext.botSignals.AddAsync(signal);
            await dbContext.SaveChangesAsync();

            return responseBase.ResponseSuccess("Thêm tín hiệu thành công.");
        }
        catch (Exception ex)
        {
            return responseBase.ResponseError(StatusCodes.Status500InternalServerError, "Lỗi: " + ex.Message);
        }
    }

    // 2. Lấy 10 tín hiệu mới nhất
    public async Task<ResponseObject<List<DTO_BotSignal>>> GetSignals()
    {
        try
        {
            var list = await dbContext.botSignals
                .OrderByDescending(e => e.DateTime)
                .Take(10)
                .ToListAsync();

            var dtos = list.Select(x => converter.EntityToDTO(x)).ToList();
            return responseObjectList.responseObjectSuccess("Thành công.", dtos);
        }
        catch (Exception ex)
        {
            return responseObjectList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
        }
    }

    // 3. Hàm Cache phụ trợ
    private void CacheSignal(string signal)
    {
        var now = TimeOnly.FromDateTime(DateTime.Now);
        var noon = new TimeOnly(12, 00);
        string key = now < noon ? "Morning" : "Afternoon";

        memoryCache.Set(key, signal, TimeSpan.FromHours(3));
    }
}