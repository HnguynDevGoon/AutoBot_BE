using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_ChatRoom : IService_ChatRoom
    {
        private readonly AppDbContext dbContext;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ResponseObject<List<DTO_ChatRoom>> responseList;
        private readonly ResponseObject<DTO_ChatRoom> responseObject;
        private readonly ResponseBase responseBase;

        // 1. CONSTRUCTOR: Tiêm các Dependency vào
        public Service_ChatRoom(
            AppDbContext dbContext,
            IHubContext<ChatHub> hubContext,
            ResponseObject<List<DTO_ChatRoom>> responseList,
            ResponseObject<DTO_ChatRoom> responseObject,
            ResponseBase responseBase)
        {
            this.dbContext = dbContext;
            this._hubContext = hubContext;
            this.responseList = responseList;
            this.responseObject = responseObject;
            this.responseBase = responseBase;
        }

        public async Task<ResponseObject<List<DTO_ChatRoom>>> GetChatRooms()
        {
            try
            {
                // BƯỚC 1: Truy vấn (Giữ nguyên)
                var rooms = await dbContext.chatRooms
                    .Include(r => r.Messages)
                    .Include(r => r.User)
                    .Where(r => r.Messages.Any())
                    .ToListAsync();

                // BƯỚC 2: Map sang DTO
                var result = rooms.Select(r =>
                {
                    var lastMsg = r.Messages.OrderByDescending(m => m.Timestamp).FirstOrDefault();
                    var unreadCount = r.Messages.Count(m => !m.IsRead && !m.IsAdminSender);

                    bool isGuest = r.UserId == null;

                    string displayName;
                    string avatarUrl;

                    if (!isGuest && r.User != null)
                    {
                        // -- CASE: USER --
                        displayName = r.User.FullName;
                        if (!string.IsNullOrEmpty(r.User.UrlAvatar))
                        {
                            avatarUrl = r.User.UrlAvatar;
                        }
                        else
                        {
                            avatarUrl = $"https://ui-avatars.com/api/?name={displayName}&background=random";
                        }
                    }
                    else
                    {
                        // -- CASE: KHÁCH --
                        var shortId = !string.IsNullOrEmpty(r.GuestSessionId) && r.GuestSessionId.Length > 5
                                      ? r.GuestSessionId.Substring(0, 5)
                                      : "Guest";
                        displayName = $"Khách ({shortId})";
                        avatarUrl = "https://res.cloudinary.com/drpxjqd47/image/upload/v1763051875/xusxceivnufh4ncc8peb.jpg";
                    }

                    return new DTO_ChatRoom
                    {
                        // Id này dùng để định tuyến tin nhắn (RoomKey)
                        Id = isGuest ? r.GuestSessionId : r.UserId.ToString(),

                        Name = displayName,
                        Avatar = avatarUrl,
                        LastMessage = lastMsg?.Message ?? "[Hình ảnh/File]",
                        LastMessageTime = lastMsg?.Timestamp ?? r.CreatedAt,
                        UnreadCount = unreadCount,
                        IsGuest = isGuest,
                        isAdminSeen = false,
                        isUserSeen = false,
                        IsAdminLastSender = lastMsg?.IsAdminSender ?? false,
                        roomId = r.Id,
                        // --- TRẢ VỀ ĐẦY ĐỦ ID GỐC ---
                        UserId = r.UserId,               // Trả về Guid (hoặc null)
                        GuestId = r.GuestSessionId       // Trả về String (hoặc null)
                    };
                })
                .OrderByDescending(x => x.LastMessageTime)
                .ToList();

                return responseList.responseObjectSuccess("Lấy danh sách hội thoại thành công", result);
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_ChatRoom>> DeleteChatRoom(Guid chatRoomId)
        {
            var response = new ResponseObject<DTO_ChatRoom>();

            try
            {
                // 1. Lấy phòng chat (bao gồm Messages)
                var chatRoom = await dbContext.chatRooms
                    .Include(cr => cr.Messages)
                    .FirstOrDefaultAsync(cr => cr.Id == chatRoomId);

                if (chatRoom == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy phòng chat", null);
                }

                // 2. Xóa toàn bộ tin nhắn thuộc phòng
                if (chatRoom.Messages != null && chatRoom.Messages.Any())
                {
                    dbContext.chatMessages.RemoveRange(chatRoom.Messages);  // <--- đúng DBSet
                }

                // 3. Xóa phòng chat
                dbContext.chatRooms.Remove(chatRoom);

                await dbContext.SaveChangesAsync();

                return responseObject.responseObjectSuccess("Xóa phòng chat thành công", null);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, ex.Message, null);
            }
        }

    }
}
