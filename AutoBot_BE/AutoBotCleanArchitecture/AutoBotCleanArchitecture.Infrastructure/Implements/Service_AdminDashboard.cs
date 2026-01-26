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
        private readonly Converter_BotSignal _convSignal;
        private readonly Converter_PurchaseHistory _convPurchase;
        private readonly Converter_Content _convContent;
        private readonly Converter_OtherContent _convOtherContent;
        private readonly Converter_Role _convRole;
        private readonly Converter_Expense _convExpense;
        private readonly Converter_ProfitLoss _convProfitLoss;

        public Service_AdminDashboard(AppDbContext dbContext, ResponseObject<DTO_AdminDashboard> responseObject, Converter_User convUser, Converter_BotSignal convSignal, Converter_PurchaseHistory convPurchase, Converter_Content convContent, Converter_OtherContent convOtherContent, Converter_Role convRole, Converter_Expense convExpense, Converter_ProfitLoss convProfitLoss)
        {
            this.dbContext = dbContext;
            this.responseObject = responseObject;
            _convUser = convUser;
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
                    Users = new List<DTO_User>(), // <--- Init List User
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

                // 1. SEARCH USER (UserName, FullName, Email, PhoneNumber)
                var users = await dbContext.users // Giả sử tên DbSet là 'users'
                    .Where(x => x.UserName.ToLower().Contains(key) ||
                                x.FullName.ToLower().Contains(key) ||
                                x.Email.ToLower().Contains(key) ||
                                (x.PhoneNumber != null && x.PhoneNumber.Contains(key)))
                    .Take(5).ToListAsync();
                result.Users = users.Select(x => _convUser.EntityToDTO(x)).ToList();

                // 2. BOT SIGNAL
                var signals = await dbContext.botSignals
                    .Where(x => x.Signal.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.BotSignals = signals.Select(x => _convSignal.EntityToDTO(x)).ToList();

                // 3. PURCHASE HISTORY
                var purchases = await dbContext.purchaseHistories
                    .Include(x => x.User).Include(x => x.BotTrading).Include(x => x.Wallet)
                    .Where(x => x.OrderCode.ToString().Contains(key) ||
                                x.PaymentMethod.ToLower().Contains(key) ||
                                x.Status.ToLower().Contains(key) ||
                                x.User.UserName.ToLower().Contains(key) ||
                                (x.BotTrading != null && x.BotTrading.NameBot.ToLower().Contains(key)))
                    .Take(5).ToListAsync();
                result.PurchaseHistories = purchases.Select(x => _convPurchase.EntityToDTO(x)).ToList();

                // 4. CONTENT
                var contents = await dbContext.contents
                    .Where(x => x.Title.ToLower().Contains(key) ||
                                x.Description.ToLower().Contains(key) ||
                                (x.Link != null && x.Link.ToLower().Contains(key)))
                    .Take(5).ToListAsync();
                result.Contents = contents.Select(x => _convContent.EntityToDTO(x)).ToList();

                // 5. OTHER CONTENT
                var otherContents = await dbContext.otherContents
                    .Where(x => x.Title.ToLower().Contains(key) ||
                                x.Description.ToLower().Contains(key) ||
                                x.OtherType.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.OtherContents = otherContents.Select(x => _convOtherContent.EntityToDTO(x)).ToList();

                // 6. ROLE
                var roles = await dbContext.roles
                    .Where(x => x.RoleName.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Roles = roles.Select(x => _convRole.EntityToDTO(x)).ToList();

                // 7. EXPENSE
                var expenses = await dbContext.expenses
                    .Where(x => x.Name.ToLower().Contains(key) || x.Description.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.Expenses = expenses.Select(x => _convExpense.EntityToDTO(x)).ToList();

                // 8. PROFIT LOSS
                var profitLosses = await dbContext.profitLosses
                    .Include(x => x.User)
                    .Where(x => x.User != null && x.User.UserName.ToLower().Contains(key))
                    .Take(5).ToListAsync();
                result.ProfitLosses = profitLosses.Select(x => _convProfitLoss.EntityToDTO(x)).ToList();

                // Tính tổng
                int total = result.Users.Count + result.BotSignals.Count + result.PurchaseHistories.Count +
                            result.Contents.Count + result.OtherContents.Count +
                            result.Roles.Count + result.Expenses.Count + result.ProfitLosses.Count;

                return responseObject.responseObjectSuccess($"Tìm thấy {total} kết quả cho '{keyword}'", result);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
    }
}