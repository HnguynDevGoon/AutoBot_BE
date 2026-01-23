using AutoBotCleanArchitecture.Persistence.DBContext;
using Google;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
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

            if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out Guid userId))
            {
                // =================================================================
                // 1. KIỂM TRA HẠN SỬ DỤNG (ĐÂY LÀ ĐOẠN QUAN TRỌNG NHẤT)
                // =================================================================
                var isVip = await dbContext.userBots
                    .AnyAsync(ub => ub.UserId == userId && ub.ExpiredDate > DateTime.UtcNow);

                if (isVip)
                {
                    // NẾU CÒN HẠN: Add vào nhóm VIP để lát nữa Controller bắn tin cho nhóm này
                    await Groups.AddToGroupAsync(Context.ConnectionId, "VIP_USERS");

                    await Task.Delay(500);

                    // Báo cho Client biết là màu xanh
                    await Clients.Caller.SendAsync("ServerMessage", "VIP_USERS");
                }
                else
                {
                    // NẾU KHÔNG CÓ HẠN: 
                    // 1. KHÔNG add vào group VIP -> Nên Admin bắn lệnh sẽ KHÔNG nhận được.
                    // 2. Báo EXPIRED để Frontend khóa nút lại.
                    await Clients.Caller.SendAsync("ServerMessage", "EXPIRED");
                }
                // =================================================================

                // Logic cũ: Quản lý thiết bị (Giữ nguyên)
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