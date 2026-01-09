using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.BotTrading;
using AutoBotCleanArchitecture.Application.Requests.PriceBot;
using AutoBotCleanArchitecture.Application.Requests.User;
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
    public class Service_BotTrading : IService_BotTrading
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseObject<DTO_BotTrading> responseObject;
        private readonly ResponseObject<DTO_PriceBots> responseObjectPriceBot;
        private readonly ResponseObject<List<DTO_BotTrading>> responseObjectList;
        private readonly ResponseBase responseBase;
        private readonly Converter_BotTrading converter_BotTrading;
        private readonly ResponseObject<ResponsePagination<DTO_BotTrading>> responsePagination;
        private readonly ResponseObject<ResponsePagination<DTO_PriceBots>> responsePaginationPriceBot;
        private readonly ResponseObject<ResponsePagination<DTO_BotTrading>> responsePaginationBotTrading;

        public Service_BotTrading(AppDbContext dbContext, ResponseObject<DTO_BotTrading> responseObject, ResponseObject<DTO_PriceBots> responseObjectPriceBot, ResponseObject<List<DTO_BotTrading>> responseObjectList, ResponseBase responseBase, Converter_BotTrading converter_BotTrading, ResponseObject<ResponsePagination<DTO_BotTrading>> responsePagination, ResponseObject<ResponsePagination<DTO_PriceBots>> responsePaginationPriceBot, ResponseObject<ResponsePagination<DTO_BotTrading>> responsePaginationBotTrading)
        {
            this.dbContext = dbContext;
            this.responseObject = responseObject;
            this.responseObjectPriceBot = responseObjectPriceBot;
            this.responseObjectList = responseObjectList;
            this.responseBase = responseBase;
            this.converter_BotTrading = converter_BotTrading;
            this.responsePagination = responsePagination;
            this.responsePaginationPriceBot = responsePaginationPriceBot;
            this.responsePaginationBotTrading = responsePaginationBotTrading;
        }



        // 1. GET ALL
        //public async Task<ResponseObject<ResponsePagination<DTO_BotTrading>>> GetListBot(int? pageSize, int? pageNumber)
        //{
        //    try
        //    {
        //        var query = dbContext.botTradings.AsQueryable();

        //        // Nếu không truyền pageSize hoặc pageNumber → lấy full list
        //        bool noPagination = !pageSize.HasValue || !pageNumber.HasValue || pageSize <= 0 || pageNumber <= 0;

        //        // Lấy toàn bộ items để tính TotalItems
        //        var totalItems = await query.CountAsync();

        //        List<BotTrading> bots;

        //        if (noPagination)
        //        {
        //            // Không phân trang
        //            bots = await query.ToListAsync();
        //        }
        //        else
        //        {
        //            // Có phân trang
        //            bots = await query
        //                .Skip((pageNumber.Value - 1) * pageSize.Value)
        //                .Take(pageSize.Value)
        //                .ToListAsync();
        //        }

        //        var botDtos = bots.Select(b => new DTO_BotTrading
        //        {
        //            Id = b.Id,
        //            NameBot = b.NameBot,
        //            InterestRate = b.InterestRate,
        //            TotalProfit = b.TotalProfit,
        //            CommandNumber = b.CommandNumber,
        //            WinRate = b.WinRate
        //        }).ToList();

        //        // Tính TotalPages nếu có phân trang
        //        int totalPages = noPagination
        //            ? 1
        //            : (int)Math.Ceiling((double)totalItems / pageSize.Value);

        //        var paginationData = new ResponsePagination<DTO_BotTrading>
        //        {
        //            Items = botDtos,
        //            CurrentPage = noPagination ? 1 : pageNumber.Value,
        //            PageSize = noPagination ? totalItems : pageSize.Value,
        //            TotalItems = totalItems,
        //            TotalPages = totalPages
        //        };

        //        return responsePagination.responseObjectSuccess("Lấy danh sách bot thành công", paginationData);
        //    }
        //    catch (Exception ex)
        //    {
        //        return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
        //    }
        //}
        public async Task<ResponseObject<ResponsePagination<DTO_BotTrading>>> GetListBot(int? pageSize, int? pageNumber)
        {
            try
            {
                var query = dbContext.botTradings
                    .Include(x => x.PriceBots)  
                    .AsQueryable();

                bool noPagination = !pageSize.HasValue || !pageNumber.HasValue || pageSize <= 0 || pageNumber <= 0;

                var totalItems = await query.CountAsync();

                List<BotTrading> bots;

                if (noPagination)
                {
                    bots = await query.ToListAsync();
                }
                else
                {
                    bots = await query
                        .Skip((pageNumber.Value - 1) * pageSize.Value)
                        .Take(pageSize.Value)
                        .ToListAsync();
                }

                var botDtos = bots.Select(b => new DTO_BotTrading
                {
                    Id = b.Id,
                    NameBot = b.NameBot,
                    InterestRate = b.InterestRate,
                    TotalProfit = b.TotalProfit,
                    CommandNumber = b.CommandNumber,
                    WinRate = b.WinRate,

                    // ⭐ Trả ra danh sách giá theo Month
                    PriceOptions = b.PriceBots?.Select(p => new DTO_PriceBots
                    {
                        Id = p.Id,
                        Month = p.Month,
                        Price = p.Price,
                        Discount = p.Discount,
                        Description = p.DescriptionBot
                    }).ToList()
                }).ToList();

                int totalPages = noPagination
                    ? 1
                    : (int)Math.Ceiling((double)totalItems / pageSize.Value);

                var paginationData = new ResponsePagination<DTO_BotTrading>
                {
                    Items = botDtos,
                    CurrentPage = noPagination ? 1 : pageNumber.Value,
                    PageSize = noPagination ? totalItems : pageSize.Value,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return responsePagination.responseObjectSuccess("Lấy danh sách bot thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }


        public async Task<ResponseObject<DTO_BotTrading>> GetBot(Guid id)
        {
            try
            {
                var bot = await dbContext.botTradings.FindAsync(id);
                if (bot == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy Bot", null);
                }

                return responseObject.responseObjectSuccess("Tìm thấy Bot", converter_BotTrading.EntityToDTO(bot));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_BotTrading>> CreateBot(Request_BotTrading request)
        {
            try
            {
                var newBot = new BotTrading
                {
                    NameBot = request.NameBot,
                    InterestRate = request.InterestRate,
                    TotalProfit = request.TotalProfit,
                    CommandNumber = request.CommandNumber,
                    WinRate = request.WinRate,
                };

                await dbContext.botTradings.AddAsync(newBot);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Thêm Bot thành công", converter_BotTrading.EntityToDTO(newBot));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_BotTrading>> UpdateBot(Request_UpdateBotTrading request)
        {
            try
            {
                var existingBot = await dbContext.botTradings.FirstOrDefaultAsync(x => x.Id == request.Id);
                if (existingBot == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", null);
                }

                existingBot.NameBot = request.NameBot;
                existingBot.InterestRate = request.InterestRate;
                existingBot.TotalProfit = request.TotalProfit;
                existingBot.CommandNumber = request.CommandNumber;
                existingBot.WinRate = request.WinRate;

                dbContext.botTradings.Update(existingBot);
                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Cập nhật Bot thành công", converter_BotTrading.EntityToDTO(existingBot));
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseBase> DeleteBot(Guid id)
        {
            try
            {
                var bot = await dbContext.botTradings.FindAsync(id);
                if (bot == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Bot không tồn tại để xóa");
                }

                var relatedPrices = dbContext.priceBots.Where(x => x.BotTradingId == id);
                if (relatedPrices.Any())
                {
                    dbContext.priceBots.RemoveRange(relatedPrices);
                }

                dbContext.botTradings.Remove(bot);

                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Đã xóa Bot và toàn bộ gói giá");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        //6. GetAll Price Bot
        public async Task<ResponseObject<ResponsePagination<DTO_PriceBots>>> GetListPriceBot(int? pageSize, int? pageNumber)
        {
            try
            {
                var query = dbContext.priceBots
                    .Include(x => x.BotTrading)
                    .AsQueryable();

                // Nếu không truyền pageSize hoặc pageNumber → lấy full list
                bool noPagination = !pageSize.HasValue || !pageNumber.HasValue || pageSize <= 0 || pageNumber <= 0;

                // Lấy toàn bộ items để tính TotalItems
                var totalItems = await query.CountAsync();

                List<PriceBot> bots;

                if (noPagination)
                {
                    // Không phân trang
                    bots = await query.ToListAsync();
                }
                else
                {
                    // Có phân trang
                    bots = await query
                        .Skip((pageNumber.Value - 1) * pageSize.Value)
                        .Take(pageSize.Value)
                        .ToListAsync();
                }

                var botDtos = bots.Select(b => new DTO_PriceBots
                {
                    Id = b.Id,
                    Month = b.Month,
                    Price = b.Price,
                    Discount = b.Discount,
                    Description = b.DescriptionBot,
                    BotTradingId = b.BotTradingId,
                    NameBot = b.BotTrading.NameBot

                }).ToList();

                // Tính TotalPages nếu có phân trang
                int totalPages = noPagination
                    ? 1
                    : (int)Math.Ceiling((double)totalItems / pageSize.Value);

                var paginationData = new ResponsePagination<DTO_PriceBots>
                {
                    Items = botDtos,
                    CurrentPage = noPagination ? 1 : pageNumber.Value,
                    PageSize = noPagination ? totalItems : pageSize.Value,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                return responsePaginationPriceBot.responseObjectSuccess("Lấy danh sách bot thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePaginationPriceBot.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        //7. Create Price Bot
        public async Task<ResponseBase> CreatePriceBot(Request_CreatePriceBot request)
        {
            try
            {
                // Map từ Request sang Entity
                var newPriceBot = new PriceBot
                {
                    Id = new Guid(),
                    Month = request.Month,
                    Price = request.Price,
                    Discount = request.Discount,
                    DescriptionBot = request.Description,
                    BotTradingId = request.BotTradingId
                };

                await dbContext.priceBots.AddAsync(newPriceBot);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Thêm Bot thành công");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        //8. Delete Price Bot
        public async Task<ResponseBase> DeletePriceBot(Guid id)
        {
            try
            {
                var bot = await dbContext.priceBots.FindAsync(id);
                if (bot == null)
                {
                    return responseBase.ResponseError(StatusCodes.Status404NotFound, "Gói Bot không tồn tại để xóa");
                }

                dbContext.priceBots.Remove(bot);
                await dbContext.SaveChangesAsync();

                return responseBase.ResponseSuccess("Xóa gói Bot thành công");
            }
            catch (Exception ex)
            {
                return responseBase.ResponseError(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        //9. Search Bot
        public async Task<ResponseObject<ResponsePagination<DTO_BotTrading>>> SearchBotTradingByAdmin(Request_SearchBotTradingByAdmin request)
        {
            try
            {
                var query = dbContext.botTradings.AsQueryable();

                // 1. Lọc Keyword (Giữ nguyên)
                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    var keywords = request.Keyword.Trim().ToLower().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var k in keywords)
                    {
                        query = query.Where(x =>
                            x.NameBot.ToLower().Contains(k)
                        );
                    }
                }

                IOrderedQueryable<BotTrading>? orderedQuery = null;

                // 1. InterestRate
                if (request.InterestRate.HasValue)
                {
                    orderedQuery = request.InterestRate.Value
                        ? query.OrderBy(x => x.InterestRate)
                        : query.OrderByDescending(x => x.InterestRate);
                }

                // 2. TotalProfit
                if (request.TotalProfit.HasValue)
                {
                    orderedQuery = orderedQuery == null
                        ? (request.TotalProfit.Value
                            ? query.OrderBy(x => x.TotalProfit)
                            : query.OrderByDescending(x => x.TotalProfit))
                        : (request.TotalProfit.Value
                            ? orderedQuery.ThenBy(x => x.TotalProfit)
                            : orderedQuery.ThenByDescending(x => x.TotalProfit));
                }

                // 3. WinRate
                if (request.WinRate.HasValue)
                {
                    orderedQuery = orderedQuery == null
                        ? (request.WinRate.Value
                            ? query.OrderBy(x => x.WinRate)
                            : query.OrderByDescending(x => x.WinRate))
                        : (request.WinRate.Value
                            ? orderedQuery.ThenBy(x => x.WinRate)
                            : orderedQuery.ThenByDescending(x => x.WinRate));
                }

                // 4. Mặc định nếu không có sort nào
                if (orderedQuery == null)
                {
                    orderedQuery = query.OrderByDescending(x => x.Id);
                }


                // ----------------------------------

                // 4. Phân trang & Trả về (Giữ nguyên)
                var totalItems = await orderedQuery.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                var users = await orderedQuery
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                var userDtos = users.Select(x => converter_BotTrading.EntityToDTO(x)).ToList();

                var paginationData = new ResponsePagination<DTO_BotTrading>
                {
                    Items = userDtos,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                if (userDtos.Count == 0)
                {
                    return responsePagination.responseObjectSuccess("Không tìm thấy kết quả nào phù hợp.", paginationData);
                }

                return responsePagination.responseObjectSuccess("Tìm kiếm thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<ResponsePagination<DTO_PriceBots>>> SearchPriceBotByAdmin(Request_SearchPriceBotByAdmin request)
        {
            try
            {
                var query = dbContext.priceBots
                    .Include(x => x.BotTrading) // Include để lấy tên Bot
                    .AsQueryable();

                // 1. Lọc Keyword
                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    var keyword = request.Keyword.Trim().ToLower();
                    query = query.Where(x =>
                        x.BotTrading.NameBot.ToLower().Contains(keyword) ||
                        x.DescriptionBot.ToLower().Contains(keyword)
                    );
                }

                IOrderedQueryable<PriceBot>? orderedQuery = null;

                // 2. Sort Price
                if (request.Price.HasValue)
                {
                    orderedQuery = request.Price.Value
                        ? query.OrderBy(x => x.Price)
                        : query.OrderByDescending(x => x.Price);
                }

                // 3. Sort Discount
                if (request.Discount.HasValue)
                {
                    orderedQuery = orderedQuery == null
                        ? (request.Discount.Value
                            ? query.OrderBy(x => x.Discount)
                            : query.OrderByDescending(x => x.Discount))
                        : (request.Discount.Value
                            ? orderedQuery.ThenBy(x => x.Discount)
                            : orderedQuery.ThenByDescending(x => x.Discount));
                }

                // 4. Mặc định sort theo ID nếu không chọn gì
                if (orderedQuery == null)
                {
                    orderedQuery = query.OrderByDescending(x => x.Id);
                }

                // 5. Phân trang
                var totalItems = await orderedQuery.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                var prices = await orderedQuery
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                // Map sang DTO
                var priceDtos = prices.Select(b => new DTO_PriceBots
                {
                    Id = b.Id,
                    Month = b.Month,
                    Price = b.Price,
                    Discount = b.Discount,
                    Description = b.DescriptionBot,
                    BotTradingId = b.BotTradingId,
                    NameBot = b.BotTrading.NameBot
                }).ToList();

                var paginationData = new ResponsePagination<DTO_PriceBots>
                {
                    Items = priceDtos,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                if (priceDtos.Count == 0)
                {
                    return responsePaginationPriceBot.responseObjectSuccess("Không tìm thấy kết quả nào phù hợp.", paginationData);
                }

                return responsePaginationPriceBot.responseObjectSuccess("Tìm kiếm thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePaginationPriceBot.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        //10. Update Price Bot
        public async Task<ResponseObject<DTO_PriceBots>> UpdatePriceBot(Request_UpdatePriceBot request)
        {
            try
            {
                var existingBot = await dbContext.priceBots.FirstOrDefaultAsync(x => x.Id == request.Id);
                if (existingBot == null)
                {
                    return responseObjectPriceBot.responseObjectError(StatusCodes.Status404NotFound, "Bot không tồn tại", null);
                }

                existingBot.Month = request.Month;
                existingBot.Price = request.Price;
                existingBot.Discount = request.Discount;
                existingBot.DescriptionBot = request.Description;
                existingBot.BotTradingId = request.BotTradingId;

                dbContext.priceBots.Update(existingBot);
                await dbContext.SaveChangesAsync();

                return responseObjectPriceBot.responseObjectSuccess("Cập nhật Bot thành công", null);
            }
            catch (Exception ex)
            {
                return responseObjectPriceBot.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}