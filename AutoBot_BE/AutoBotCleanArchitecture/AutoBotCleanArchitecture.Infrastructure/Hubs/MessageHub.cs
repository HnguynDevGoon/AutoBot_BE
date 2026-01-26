using AutoBotCleanArchitecture.Persistence.DBContext;
using Google;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Hubs
{
    public class MessageHub : Hub
    {
        private readonly UserConnectionManager connectionManager;
        private readonly AppDbContext dbContext;

        public MessageHub(UserConnectionManager connectionManager, AppDbContext dbContext)
        {
            this.connectionManager = connectionManager;
            this.dbContext = dbContext;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdString = Context.User?.FindFirst("Id")?.Value ?? "";

            // 2. LẤY ROLE CỦA USER RA (Thường key là ClaimTypes.Role hoặc "role")
            var userRole = Context.User?.FindFirst(ClaimTypes.Role)?.Value
                        ?? Context.User?.FindFirst("role")?.Value
                        ?? "";

            if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out Guid userId))
            {
                // =================================================================
                // KIỂM TRA QUYỀN NHẬN TIN (ADMIN HOẶC ĐÃ MUA BOT)
                // =================================================================

                // Check 1: Có phải Admin không?
                bool isAdmin = userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

                // Check 2: Có gói Bot còn hạn không? (Nếu là Admin rồi thì khỏi query DB cho nhẹ)
                bool hasValidBot = false;
                if (!isAdmin)
                {
                    hasValidBot = await dbContext.userBots
                        .AnyAsync(ub => ub.UserId == userId && ub.ExpiredDate > DateTime.UtcNow);
                }

                // LOGIC CHỐT: Là Admin HOẶC Có Bot -> Đều là VIP
                if (isAdmin || hasValidBot)
                {
                    // Add vào nhóm VIP để nhận tín hiệu
                    await Groups.AddToGroupAsync(Context.ConnectionId, "VIP_USERS");

                    await Task.Delay(500);

                    // Báo OK
                    await Clients.Caller.SendAsync("ServerMessage", "VIP_USERS");
                }
                else
                {
                    // Không phải Admin mà cũng không mua Bot -> Chặn
                    await Clients.Caller.SendAsync("ServerMessage", "EXPIRED");
                }
                // =================================================================

                // Logic quản lý thiết bị (Giữ nguyên)
                if (connectionManager.TryGetConnection(userIdString, out string oldConnectionId))
                {
                    if (!string.IsNullOrEmpty(oldConnectionId))
                    {
                        await Clients.Client(oldConnectionId).SendAsync("ServerMessage", "LOGOUT");
                    }
                    connectionManager.TryRemoveConnection(userIdString, out _);
                    connectionManager.TryAddConnection(userIdString, Context.ConnectionId);
                }
                else
                {
                    connectionManager.TryAddConnection(userIdString, Context.ConnectionId);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("Id")?.Value ?? "";
            if (!string.IsNullOrEmpty(userId))
            {
                connectionManager.TryRemoveConnection(userId, out _);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}