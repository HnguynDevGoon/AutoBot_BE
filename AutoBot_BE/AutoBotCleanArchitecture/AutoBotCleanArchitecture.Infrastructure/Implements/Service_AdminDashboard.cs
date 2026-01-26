using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_AdminDashboard : IService_AdminDashboard
    {
        private readonly AppDbContext dbContext;
        private readonly ResponseObject<DTO_AdminDashboard> responseObject;

        private readonly Converter_User _convUser;
        private readonly Converter_BotTrading _convBot;
        private readonly Converter_BotSignal _convSignal;
        private readonly Converter_PurchaseHistory _convPurchase;
        private readonly Converter_Content _convContent;
        private readonly Converter_OtherContent _convOtherContent;
        private readonly Converter_Role _convRole;
        private readonly Converter_Expense _convExpense;
        private readonly Converter_ProfitLoss _convProfitLoss;

        public Service_AdminDashboard(AppDbContext dbContext, ResponseObject<DTO_AdminDashboard> responseObject, Converter_User convUser, Converter_BotTrading convBot, Converter_BotSignal convSignal, Converter_PurchaseHistory convPurchase, Converter_Content convContent, Converter_OtherContent convOtherContent, Converter_Role convRole, Converter_Expense convExpense, Converter_ProfitLoss convProfitLoss)
        {
            this.dbContext = dbContext;
            this.responseObject = responseObject;
            _convUser = convUser;
            _convBot = convBot;
            _convSignal = convSignal;
            _convPurchase = convPurchase;
            _convContent = convContent;
            _convOtherContent = convOtherContent;
            _convRole = convRole;
            _convExpense = convExpense;
            _convProfitLoss = convProfitLoss;
        }

        public async Task<ResponseObject<DTO_AdminDashboard>> SearchGlobal(string keyword)
        {
            try
            {
                var result = new DTO_AdminDashboard
                {
                    Users = new List<DTO_User>(),
                    Bots = new List<DTO_BotTrading>(), // <--- Init List Bot
                    BotSignals = new List<DTO_BotSignal>(),
                    PurchaseHistories = new List<DTO_PurchaseHistory>(),
                    Contents = new List<DTO_Content>(),
                    OtherContents = new List<DTO_OtherContent>(),
                    Roles = new List<DTO_Role>(),
                    Expenses = new List<DTO_Expense>(),
                    ProfitLosses = new List<DTO_ProfitLoss>()
                };

                if (string.IsNullOrWhiteSpace(keyword))
                    return responseObject.responseObjectSuccess("Vui lòng nhập từ khóa", result);

                string key = keyword.ToLower().Trim();

                // 1. USER
                var users = await dbContext.users
                    .Where(x => x.UserName.ToLower().Contains(key) || x.Email.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Users = users.Select(x => _convUser.EntityToDTO(x)).ToList();

                // 2. BOT TRADING (Mới thêm - Tìm theo NameBot)
                var bots = await dbContext.botTradings // Giả sử tên DbSet là 'botTradings'
                    .Where(x => x.NameBot.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Bots = bots.Select(x => _convBot.EntityToDTO(x)).ToList();

                // 3. BOT SIGNAL
                var signals = await dbContext.botSignals
                    .Where(x => x.Signal.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.BotSignals = signals.Select(x => _convSignal.EntityToDTO(x)).ToList();

                // 4. PURCHASE HISTORY
                var purchases = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading)
                    .Where(x => x.OrderCode.ToString().Contains(key) ||
                                x.User.UserName.ToLower().Contains(key) ||
                                (x.BotTrading != null && x.BotTrading.NameBot.ToLower().Contains(key)))
                    .Take(5).ToListAsync();
                result.PurchaseHistories = purchases.Select(x => _convPurchase.EntityToDTO(x)).ToList();

                // 5. EXPENSE
                var expenses = await dbContext.expenses
                    .Where(x => x.Name.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Expenses = expenses.Select(x => _convExpense.EntityToDTO(x)).ToList();

                // 6. PROFIT LOSS
                var profitLosses = await dbContext.profitLosses
                    .Include(x => x.User)
                    .Where(x => x.User != null && x.User.UserName.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.ProfitLosses = profitLosses.Select(x => _convProfitLoss.EntityToDTO(x)).ToList();

                // 7. CONTENT
                var contents = await dbContext.contents
                    .Where(x => x.Title.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Contents = contents.Select(x => _convContent.EntityToDTO(x)).ToList();

                // 8. OTHER CONTENT
                var otherContents = await dbContext.otherContents
                    .Where(x => x.Title.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.OtherContents = otherContents.Select(x => _convOtherContent.EntityToDTO(x)).ToList();

                // 9. ROLE
                var roles = await dbContext.roles
                    .Where(x => x.RoleName.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Roles = roles.Select(x => _convRole.EntityToDTO(x)).ToList();

                // Tính tổng
                int total = result.Users.Count + result.Bots.Count + result.BotSignals.Count +
                            result.PurchaseHistories.Count + result.Expenses.Count + result.ProfitLosses.Count +
                            result.Contents.Count + result.OtherContents.Count + result.Roles.Count;

                return responseObject.responseObjectSuccess($"Tìm thấy {total} kết quả cho '{keyword}'", result);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}