using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.ChatMessage;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Infrastructure.Helper; 
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http; 
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims; 
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        public Service_Chat(
            AppDbContext dbContext,
            IHubContext<ChatHub> hubContext,
            ResponseObject<IList<DTO_ChatMessage>> responseList,
            ResponseObject<bool> responseBool,
            Converter_ChatMessage converter,
            IHttpContextAccessor httpContextAccessor)
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
                    SenderId = !string.IsNullOrEmpty(currentUserId) ? Guid.Parse(currentUserId) : null,
                    TypeMessage = request.TypeMessage,
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

                ChatRoom room = null;

                // --- TRƯỜNG HỢP 1: ADMIN ---
                if (isAdmin)
                {
                    if (!string.IsNullOrEmpty(request.TargetId))
                    {
                        // --- FIX LỖI TẠI ĐÂY ---
                        // Phải parse string sang Guid để so sánh chuẩn xác với DB
                        if (Guid.TryParse(request.TargetId, out Guid userGuid))
                        {
                            room = await dbContext.chatRooms
                                .Include(r => r.Messages)
                                .FirstOrDefaultAsync(r => r.UserId == userGuid); // So sánh Guid == Guid
                        }
                        else
                        {
                            return responseList.responseObjectError(StatusCodes.Status400BadRequest, "TargetId không đúng định dạng GUID.", null);
                        }
                    }
                    else if (!string.IsNullOrEmpty(request.GuestId))
                    {
                        // Admin xem KHÁCH -> GuestId là string nên so sánh bình thường
                        room = await dbContext.chatRooms
                            .Include(r => r.Messages)
                            .FirstOrDefaultAsync(r => r.GuestSessionId == request.GuestId);
                    }
                }

                // --- TRƯỜNG HỢP 2: USER ĐÃ ĐĂNG NHẬP (Tự xem mình) ---
                else if (!string.IsNullOrEmpty(currentUserId))
                {
                    // Parse currentUserId (từ token) sang Guid luôn cho chắc
                    if (Guid.TryParse(currentUserId, out Guid myGuid))
                    {
                        room = await dbContext.chatRooms
                            .Include(r => r.Messages)
                            .FirstOrDefaultAsync(r => r.UserId == myGuid);
                    }
                }

                // --- TRƯỜNG HỢP 3: KHÁCH (Tự xem mình) ---
                else
                {
                    if (!string.IsNullOrEmpty(request.GuestId))
                    {
                        room = await dbContext.chatRooms
                            .Include(r => r.Messages)
                            .FirstOrDefaultAsync(r => r.GuestSessionId == request.GuestId);
                    }
                }

                // --- KẾT QUẢ ---

                if (room == null)
                {
                    return responseList.responseObjectSuccess("Chưa có tin nhắn nào (New Session)", new List<DTO_ChatMessage>());
                }

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
                // 1. Check Login
                var (userIdString, _, _) = GetCurrentUserContext();
                if (string.IsNullOrEmpty(userIdString))
                {
                    return responseBool.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", false);
                }

                request.UserId = Guid.Parse(userIdString);

                if (string.IsNullOrEmpty(request.GuestId))
                {
                    return responseBool.responseObjectSuccess("Không có dữ liệu khách cần đồng bộ.", false);
                }

                // 2. Tìm phòng chat Guest (Nguồn)
                // Include Messages để lấy toàn bộ tin nhắn ra
                var guestRoom = await dbContext.chatRooms
                    .Include(r => r.Messages)
                    .FirstOrDefaultAsync(r => r.GuestSessionId == request.GuestId && r.UserId == null);

                if (guestRoom == null)
                {
                    // Không có phòng khách cũ thì coi như xong, không lỗi
                    return responseBool.responseObjectSuccess("Không tìm thấy lịch sử chat khách cũ.", true);
                }

                // 3. Tìm phòng chat User hiện tại (Đích)
                var userRoom = await dbContext.chatRooms
                    .FirstOrDefaultAsync(r => r.UserId == request.UserId);

                if (userRoom == null)
                {
                    // --- TRƯỜNG HỢP A: User chưa có phòng ---
                    // Đơn giản là đổi tên chủ phòng từ Khách -> User
                    guestRoom.UserId = request.UserId;
                    guestRoom.GuestSessionId = null; // Xóa dấu vết khách

                    // Cập nhật lại tin nhắn: Gán SenderId cho những tin của khách
                    if (guestRoom.Messages != null)
                    {
                        foreach (var msg in guestRoom.Messages)
                        {
                            if (msg.SenderId == null && !msg.IsAdminSender)
                            {
                                msg.SenderId = request.UserId;
                            }
                        }
                    }

                    dbContext.chatRooms.Update(guestRoom);
                }
                else
                {
                    // --- TRƯỜNG HỢP B: User ĐÃ CÓ phòng -> GỘP (MERGE) ---

                    if (guestRoom.Messages != null && guestRoom.Messages.Any())
                    {
                        // BƯỚC QUAN TRỌNG: 
                        // 1. Tách danh sách tin nhắn ra khỏi object guestRoom bằng .ToList()
                        // Để tránh lỗi "Collection was modified" khi đang foreach
                        var messagesToMove = guestRoom.Messages.ToList();

                        foreach (var msg in messagesToMove)
                        {
                            // 2. Chuyển hộ khẩu sang nhà mới
                            msg.ChatRoomId = userRoom.Id;
                            msg.ChatRoom = null; // Ngắt tham chiếu object cũ để EF không bị lú

                            // 3. Quy chủ tin nhắn (nếu là tin khách gửi)
                            if (msg.SenderId == null && !msg.IsAdminSender)
                            {
                                msg.SenderId = request.UserId;
                            }
                        }

                        // 4. Update dứt khoát danh sách tin nhắn này
                        dbContext.chatMessages.UpdateRange(messagesToMove);
                    }

                    // 5. Sau khi tin nhắn đã an toàn ở nhà mới, xóa phòng cũ
                    dbContext.chatRooms.Remove(guestRoom);
                }

                await dbContext.SaveChangesAsync();

                return responseBool.responseObjectSuccess("Đồng bộ thành công! Đã gộp về 1 phòng duy nhất.", true);
            }
            catch (Exception ex)
            {
                return responseBool.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, false);
            }
        }

        public async Task<ResponseObject<bool>> SeenMessage(Request_SeenMessage request)
        {
            try
            {
                // 1. Kiểm tra login (Bearer token)
                var (userIdString, _, _) = GetCurrentUserContext();
                if (string.IsNullOrEmpty(userIdString))
                {
                    return responseBool.responseObjectError(
                        StatusCodes.Status401Unauthorized,
                        "Bạn chưa đăng nhập.",
                        false
                    );
                }

                // 2. Lấy ra tin nhắn chưa đọc
                var messages = await dbContext.chatMessages
                    .Where(m => m.ChatRoomId == request.ChatRoomId && m.IsRead == false)
                    .ToListAsync();

                if (!messages.Any())
                {
                    return responseBool.responseObjectError(
                        StatusCodes.Status400BadRequest,
                        "Không tìm thấy tin nhắn chưa đọc.",
                        false
                    );
                }

                // 3. Cập nhật trạng thái
                foreach (var message in messages)
                {
                    message.IsRead = true;
                }

                await dbContext.SaveChangesAsync();

                return responseBool.responseObjectSuccess("Đã cập nhật trạng thái đọc thành công.", true);
            }
            catch (Exception ex)
            {
                return responseBool.responseObjectError(
                    StatusCodes.Status500InternalServerError,
                    ex.Message,
                    false
                );
            }
        }

        public async Task<ResponseObject<IList<DTO_ChatMessage>>> GetResources(Request_GetResources request)
        {
            try
            {
                // 1. Kiểm tra login (Bearer token)
                var (currentUserId, role, currentIp) = GetCurrentUserContext();
                bool isAdmin = role == "Admin";
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return responseList.responseObjectError(
                        StatusCodes.Status401Unauthorized,
                        "Bạn chưa đăng nhập.",
                        null
                    );
                }

                var messages = await dbContext.chatMessages
                    .Where(m =>
                        m.ChatRoomId == request.ChatRoomId
                        && m.TypeMessage == request.TypeResource
                    )
                    .OrderBy(m => m.Timestamp)   // ⬅ sắp xếp
                    .ToListAsync();

                if (!messages.Any())
                {
                    return responseList.responseObjectError(
                        StatusCodes.Status404NotFound,
                        "Không tìm thấy tin nhắn theo loại bạn đã chọn.",
                        null
                    );
                }

                // 3. Cập nhật trạng thái đã đọc
                foreach (var message in messages)
                {
                    message.IsRead = true;
                }

                await dbContext.SaveChangesAsync();

                // 4. Mapping sang DTO_ChatMessage
                var data = messages.Select(m => new DTO_ChatMessage
                {
                    Id = m.Id,
                    Message = m.Message,
                    Timestamp = m.Timestamp,
                    IsAdminSender = m.IsAdminSender,
                    IsRead = m.IsRead,
                    IpAddress = m.IpAddress,
                    TypeMessage = m.TypeMessage
                }).ToList();

                return responseList.responseObjectSuccess(
                    "Lấy danh sách thành công",
                    data
                );
            }
            catch (Exception ex)
            {
                return responseList.responseObjectError(
                    StatusCodes.Status500InternalServerError,
                    ex.Message,
                    null
                );
            }
        }

    }
}