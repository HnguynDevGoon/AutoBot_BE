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
    public class Service_Device : IService_Device
    {
        private readonly AppDbContext dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ResponseObject<List<DTO_UserDevice>> responseListDevice;

        public Service_Device(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor, ResponseObject<List<DTO_UserDevice>> responseListDevice)
        {
            this.dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
            this.responseListDevice = responseListDevice;
        }

        // --- HÀM PHỤ: LẤY USER ID TỪ TOKEN (Dùng chung cho gọn) ---
        private Guid GetUserIdFromContext()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var idClaim = user?.FindFirst("Id"); // Hoặc ClaimTypes.NameIdentifier tùy cấu hình Token của ông

            if (idClaim == null || string.IsNullOrEmpty(idClaim.Value))
            {
                throw new UnauthorizedAccessException("Token không hợp lệ hoặc thiếu User ID.");
            }

            return Guid.Parse(idClaim.Value);
        }

        public async Task<List<DTO_UserDevice>> GetDevices()
        {
            try
            {
                Guid currentUserId = GetUserIdFromContext();

                // Dùng AsNoTracking() để chỉ đọc, tránh lỗi tracking linh tinh
                var devices = await dbContext.userDevices
                    .AsNoTracking()
                    .Where(d => d.UserId == currentUserId)
                    .Select(d => new DTO_UserDevice
                    {
                        Id = d.Id,
                        UserId = d.UserId,
                        Fingerprint = d.Fingerprint,
                        AccessToken = d.AccessToken,
                        RefreshToken = d.RefreshToken,
                        CreatedAt = d.CreatedAt,
                        LastActive = d.LastUpdatedAt
                    })
                    .ToListAsync();

                return devices ?? new List<DTO_UserDevice>();
            }
            catch
            {
                return new List<DTO_UserDevice>(); // Trả về rỗng nếu lỗi xác thực
            }
        }

        public async Task<List<DTO_UserDevice>> GetAccessTokens()
        {
            try
            {
                Guid currentUserId = GetUserIdFromContext();

                var devices = await dbContext.userDevices
                    .AsNoTracking()
                    .Where(d => d.UserId == currentUserId)
                    .Select(d => new DTO_UserDevice
                    {
                        AccessToken = d.AccessToken,
                        RefreshToken = d.RefreshToken,
                    })
                    .ToListAsync();

                return devices ?? new List<DTO_UserDevice>();
            }
            catch
            {
                return new List<DTO_UserDevice>();
            }
        }

        public async Task<ResponseObject<List<DTO_UserDevice>>> LogoutAllDevices()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return responseListDevice.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Context", null);

                // 1. Lấy ID
                Guid userId;
                try 
                { 
                    userId = GetUserIdFromContext(); 
                } 
                catch 
                { 
                    return responseListDevice.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null); 
                }

                // 2. Lấy Token hiện tại (Xử lý chuỗi kỹ hơn)
                string authHeader = context.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    return responseListDevice.responseObjectError(StatusCodes.Status401Unauthorized, "Token không hợp lệ (Format sai).", null);
                }
                string currentToken = authHeader.Substring("Bearer ".Length).Trim();

                // 3. Tìm các thiết bị CẦN XÓA (Khác token hiện tại)
                var devicesToDelete = await dbContext.userDevices
                    .Where(d => d.UserId == userId && d.AccessToken != currentToken) // So sánh Token
                    .ToListAsync();

                if (devicesToDelete == null || devicesToDelete.Count == 0)
                {
                    return responseListDevice.responseObjectSuccess("Không có thiết bị khác để đăng xuất.", new List<DTO_UserDevice>());
                }

                // Lưu lại thông tin để trả về trước khi xóa
                var deletedInfo = devicesToDelete.Select(d => new DTO_UserDevice
                {
                    Id = d.Id,
                    Fingerprint = d.Fingerprint,
                    LastActive = d.LastUpdatedAt
                }).ToList();

                // 4. Xóa
                dbContext.userDevices.RemoveRange(devicesToDelete);
                await dbContext.SaveChangesAsync();

                return responseListDevice.responseObjectSuccess($"Đã đăng xuất {deletedInfo.Count} thiết bị khác.", deletedInfo);
            }
            catch (Exception ex)
            {
                return responseListDevice.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi Server: {ex.Message}", null);
            }
        }

        public async Task<ResponseObject<DTO_UserDevice>> UserLogout()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return new ResponseObject<DTO_UserDevice>().responseObjectError(500, "Lỗi Context", null);

                // 1. Lấy ID
                Guid userId;
                try { userId = GetUserIdFromContext(); } catch { return new ResponseObject<DTO_UserDevice>().responseObjectError(401, "Chưa đăng nhập", null); }

                // 2. Lấy Token
                string authHeader = context.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader)) return new ResponseObject<DTO_UserDevice>().responseObjectError(401, "Thiếu Token", null);
                
                string currentToken = authHeader.Replace("Bearer ", "").Trim();

                // 3. Tìm thiết bị hiện tại
                var currentDevice = await dbContext.userDevices
                    .FirstOrDefaultAsync(d => d.UserId == userId && d.AccessToken == currentToken);

                if (currentDevice == null)
                {
                    // Trường hợp Token hợp lệ (về mặt crypto) nhưng không có trong DB (đã bị xóa trước đó)
                    return new ResponseObject<DTO_UserDevice>().responseObjectError(404, "Phiên đăng nhập không tồn tại hoặc đã đăng xuất.", null);
                }

                // 4. Xóa Token (Soft Delete hoặc Hard Delete tùy ông)
                // Ở đây tôi làm theo kiểu Hard Delete dòng này luôn cho sạch
                dbContext.userDevices.Remove(currentDevice);
                
                // Nếu muốn giữ lại lịch sử thì dùng:
                // currentDevice.AccessToken = null; 
                // currentDevice.RefreshToken = null;

                await dbContext.SaveChangesAsync();

                // 5. Trả về kết quả
                return new ResponseObject<DTO_UserDevice>().responseObjectSuccess("Đăng xuất thành công.", new DTO_UserDevice { Id = currentDevice.Id });
            }
            catch (Exception ex)
            {
                return new ResponseObject<DTO_UserDevice>().responseObjectError(500, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_UserDevice>> LogoutDevice(Guid deviceId)
        {
            try
            {
                // 1. Lấy ID
                Guid userId;
                try { userId = GetUserIdFromContext(); } catch { return new ResponseObject<DTO_UserDevice>().responseObjectError(401, "Chưa đăng nhập", null); }

                // 2. Tìm thiết bị (Bắt buộc phải check UserId để tránh xóa dùm người khác)
                var targetDevice = await dbContext.userDevices
                    .FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId);

                if (targetDevice == null)
                {
                    return new ResponseObject<DTO_UserDevice>().responseObjectError(404, "Không tìm thấy thiết bị.", null);
                }

                // 3. Xóa
                dbContext.userDevices.Remove(targetDevice);
                await dbContext.SaveChangesAsync();

                return new ResponseObject<DTO_UserDevice>().responseObjectSuccess("Đăng xuất thiết bị thành công.", new DTO_UserDevice { Id = deviceId });
            }
            catch (Exception ex)
            {
                return new ResponseObject<DTO_UserDevice>().responseObjectError(500, ex.Message, null);
            }
        }
    }
}
