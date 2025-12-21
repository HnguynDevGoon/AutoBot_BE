using AutoBotCleanArchitecture.Infrastructure.Helper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatHub(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;

            // 1. Lấy thông tin từ Token (nếu có)
            var userId = Context.User?.FindFirst("Id")?.Value;
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

            // 2. Lấy GuestId từ Query String (FE gọi: /chatHub?guestId=xyz)
            // Dùng ?.ToString() để tránh lỗi nếu query null
            var guestId = httpContext?.Request.Query["guestId"].ToString();

            // 3. Lấy IP (Fallback cuối cùng)
            var ip = IpAdrress.GetIpAddress(httpContext);

            if (!string.IsNullOrEmpty(userId))
            {
                // CASE A: USER ĐÃ ĐĂNG NHẬP
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);

                if (role == "Admin")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "AdminGroup");
                }
            }
            else if (!string.IsNullOrEmpty(guestId) && guestId != "undefined" && guestId != "null")
            {
                // CASE B: KHÁCH VÃNG LAI (CÓ SESSION ID)
                // (Thêm check "undefined"/"null" vì đôi khi JS gửi chuỗi string bậy)
                await Groups.AddToGroupAsync(Context.ConnectionId, guestId);
            }
            else
            {
                // CASE C: KHÁCH VÃNG LAI (KHÔNG CÓ GÌ HẾT -> DÙNG IP)
                if (!string.IsNullOrEmpty(ip))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, ip);
                }
            }

            await base.OnConnectedAsync();
        }

        public async Task SendMessage(string groupId, string message, string type)
        {
            await Clients.Group(groupId).SendAsync("ReceiveMessage", new
            {
                message,
                type,
                time = DateTime.UtcNow,
                groupId
            });

            // gửi tới admin
            await Clients.Group("AdminGroup").SendAsync("ReceiveMessage", new
            {
                message,
                type,
                time = DateTime.UtcNow,
                groupId
            });
        }


        public Task JoinRoom(string guestId)
        {
            return Groups.AddToGroupAsync(Context.ConnectionId, guestId);
        }
    }
}