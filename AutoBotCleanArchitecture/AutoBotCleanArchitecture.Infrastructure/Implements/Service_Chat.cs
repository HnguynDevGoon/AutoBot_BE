using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ChatMessage;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Infrastructure.Helper; // IpAdress
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http; // Cần cái này
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims; // Cần cái này
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Chat : IService_Chat
    {
        private readonly AppDbContext dbContext;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ResponseObject<IList<DTO_ChatMessage>> responseList;
        private readonly ResponseObject<bool> responseBool;
        private readonly Converter_ChatMessage converter;
        private readonly IHttpContextAccessor _httpContextAccessor; // <-- Inject cái này

        public Service_Chat(
            AppDbContext dbContext,
            IHubContext<ChatHub> hubContext,
            ResponseObject<IList<DTO_ChatMessage>> responseList,
            ResponseObject<bool> responseBool,
            Converter_ChatMessage converter,
            IHttpContextAccessor httpContextAccessor) // Inject
        {
            this.dbContext = dbContext;
            this._hubContext = hubContext;
            this.responseList = responseList;
            this.responseBool = responseBool;
            this.converter = converter;
            this._httpContextAccessor = httpContextAccessor;
        }

        // --- HÀM HELPER ĐỂ LẤY INFO NGƯỜI DÙNG HIỆN TẠI ---
        private (string? UserId, string? Role, string Ip) GetCurrentUserContext()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return (null, null, "Unknown");

            var userId = context.User?.FindFirst("Id")?.Value;
            var role = context.User?.FindFirst(ClaimTypes.Role)?.Value;
            var ip = IpAdrress.GetIpAddress(context); // Dùng Helper của ông

            return (userId, role, ip);
        }

        // 1. GỬI TIN NHẮN
        public async Task<ResponseObject<bool>> SendMessage(Request_SendMessage request)
        {
            try
            {
                // Tự lấy thông tin người gửi
                var (currentUserId, role, currentIp) = GetCurrentUserContext();
                bool isAdmin = role == "Admin";
                string roomKey;

                // --- XÁC ĐỊNH PHÒNG CHAT ---
                if (isAdmin)
                {
                    // Admin chat: Phải có TargetId (gửi cho ai)
                    if (string.IsNullOrEmpty(request.TargetId))
                        return responseBool.responseObjectError(StatusCodes.Status400BadRequest, "Admin phải chọn người nhận.", false);
                    roomKey = request.TargetId;
                }
                else
                {
                    // User/Khách: Ưu tiên UserId -> GuestId (từ FE gửi) -> IP
                    if (!string.IsNullOrEmpty(currentUserId))
                    {
                        roomKey = currentUserId;
                    }
                    else if (!string.IsNullOrEmpty(request.GuestId)) // Nếu FE có gửi GuestId
                    {
                        roomKey = request.GuestId;
                    }
                    else
                    {
                        roomKey = currentIp; // Đường cùng mới dùng IP
                    }
                }

                // --- TÌM HOẶC TẠO PHÒNG ---
                var room = await dbContext.chatRooms.FirstOrDefaultAsync(r => r.UserId.ToString() == roomKey || r.GuestSessionId == roomKey);

                if (room == null)
                {
                    room = new ChatRoom { Id = Guid.NewGuid(), IsActive = true, CreatedAt = DateTime.UtcNow };

                    if (Guid.TryParse(roomKey, out Guid uId)) room.UserId = uId; // Là User
                    else room.GuestSessionId = roomKey; // Là Khách

                    await dbContext.chatRooms.AddAsync(room);
                    await dbContext.SaveChangesAsync();
                }

                // --- LƯU TIN NHẮN ---
                var msg = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    ChatRoomId = room.Id,
                    Message = request.Message,
                    IsAdminSender = isAdmin,
                    IpAddress = currentIp,
                    Timestamp = DateTime.UtcNow,
                    IsRead = false,
                    SenderId = !string.IsNullOrEmpty(currentUserId) ? Guid.Parse(currentUserId) : null
                };

                await dbContext.chatMessages.AddAsync(msg);
                await dbContext.SaveChangesAsync();

                // --- BẮN SIGNALR ---
                var dto = converter.EntityToDTO(msg);

                // Bắn vào phòng (RoomKey)
                await _hubContext.Clients.Group(roomKey).SendAsync("ReceiveMessage", dto);

                // Nếu khách gửi -> Báo Admin
                if (!isAdmin)
                {
                    await _hubContext.Clients.Group("AdminGroup").SendAsync("NewMessageNotification", new
                    {
                        From = roomKey,
                        Message = request.Message,
                        IsGuest = (msg.SenderId == null)
                    });
                }

                return responseBool.responseObjectSuccess("Gửi thành công", true);
            }
            catch (Exception ex)
            {
                return responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        // 2. LẤY LỊCH SỬ
        // (Ông cần tạo class Request_GetHistory chứa TargetId và GuestId nhé)
        public async Task<ResponseObject<IList<DTO_ChatMessage>>> GetHistory(Request_GetHistory request)
        {
            try
            {
                var (currentUserId, role, currentIp) = GetCurrentUserContext();
                bool isAdmin = role == "Admin";

                string roomKey;
                if (isAdmin)
                {
                    roomKey = request.TargetId; // Admin xem phòng của ai
                }
                else
                {
                    // User/Khách xem phòng của mình
                    if (!string.IsNullOrEmpty(currentUserId)) roomKey = currentUserId;
                    else if (!string.IsNullOrEmpty(request.GuestId)) roomKey = request.GuestId;
                    else roomKey = currentIp;
                }

                if (string.IsNullOrEmpty(roomKey))
                    return responseList.responseObjectSuccess("New Session", new List<DTO_ChatMessage>());

                var room = await dbContext.chatRooms
                    .Include(r => r.Messages)
                    .FirstOrDefaultAsync(r => r.UserId.ToString() == roomKey || r.GuestSessionId == roomKey);

                if (room == null)
                    return responseList.responseObjectSuccess("Chưa có tin nhắn", new List<DTO_ChatMessage>());

                var dtos = room.Messages
                    .OrderBy(m => m.Timestamp)
                    .Select(m => converter.EntityToDTO(m))
                    .ToList();

                return responseList.responseObjectSuccess("Lấy lịch sử thành công", dtos);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<bool>> SyncChat(Request_SyncChat request)
        {
            try
            {
                // 1. Tự lấy ID của User đang đăng nhập từ Token
                var (userIdString, _, _) = GetCurrentUserContext();

                if (string.IsNullOrEmpty(userIdString))
                {
                    return responseBool.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", false);
                }

                // Gán vào Request (để object request có đủ dữ liệu)
                request.UserId = Guid.Parse(userIdString);

                if (string.IsNullOrEmpty(request.GuestId))
                {
                    return responseBool.responseObjectSuccess("Không có dữ liệu khách cần đồng bộ.", false);
                }

                // 2. Tìm phòng chat cũ của Guest (mà chưa có chủ)
                var guestRoom = await dbContext.chatRooms
                    .FirstOrDefaultAsync(r => r.GuestSessionId == request.GuestId && r.UserId == null);

                if (guestRoom == null)
                {
                    // Không tìm thấy phòng cũ thì thôi, không tính là lỗi
                    return responseBool.responseObjectSuccess("Không tìm thấy lịch sử chat cũ.", false);
                }

                // 3. Gán phòng này cho User hiện tại
                guestRoom.UserId = request.UserId;
                // guestRoom.GuestSessionId = null; // (Tuỳ chọn: Xóa GuestId cũ đi cho sạch)

                dbContext.chatRooms.Update(guestRoom);
                await dbContext.SaveChangesAsync();

                return responseBool.responseObjectSuccess("Đồng bộ lịch sử chat thành công.", true);
            }
            catch (Exception ex)
            {
                return responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }
    }
}