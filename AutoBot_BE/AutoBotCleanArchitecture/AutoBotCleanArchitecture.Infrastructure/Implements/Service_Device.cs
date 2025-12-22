using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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

        public async Task<List<DTO_UserDevice>> GetDevices()
        {

            var user = _httpContextAccessor.HttpContext?.User;
            var idClaim = user?.FindFirst("Id"); 

            if (idClaim == null)
            {

                throw new UnauthorizedAccessException("Token không hợp lệ hoặc thiếu User ID.");
            }

            Guid currentUserId = Guid.Parse(idClaim.Value); 

            var devices = await dbContext.userDevices
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


        public async Task<List<DTO_UserDevice>> GetAccessTokens() 
        {

            var user = _httpContextAccessor.HttpContext?.User;
            var idClaim = user?.FindFirst("Id");

            if (idClaim == null)
            {
                throw new UnauthorizedAccessException("Token không hợp lệ hoặc thiếu User ID.");
            }

            Guid currentUserId = Guid.Parse(idClaim.Value);
    
            var devices = await dbContext.userDevices
                .Where(d => d.UserId == currentUserId) 
                .Select(d => new DTO_UserDevice
                {
                    AccessToken = d.AccessToken,
                    RefreshToken = d.RefreshToken,
                })
                .ToListAsync();

            return devices ?? new List<DTO_UserDevice>();
        }

        public async Task<ResponseObject<List<DTO_UserDevice>>> LogoutAllDevices()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return responseListDevice.responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Context", null);

                // 1. Tự lấy UserId từ Token
                var userIdString = context.User?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString))
                {
                    return responseListDevice.responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null);
                }
                var userId = Guid.Parse(userIdString);

                // 2. Tự lấy Access Token hiện tại từ Header
                // (Lấy chuỗi "Bearer ...", sau đó cắt bỏ chữ "Bearer " đi)
                string currentToken = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (string.IsNullOrEmpty(currentToken))
                {
                    return responseListDevice.responseObjectError(StatusCodes.Status401Unauthorized, "Token không hợp lệ.", null);
                }

                // 3. Logic xóa DB (Xóa của User này NHƯNG giữ lại Token đang dùng)
                // Dùng .Select() để map sang DTO luôn cho gọn
                var devicesToDelete = await dbContext.userDevices
                    .Where(d => d.UserId == userId && d.AccessToken != currentToken)
                    .Select(d => new DTO_UserDevice
                    {
                        Id = d.Id,
                        // User = d.UserId, // Không cần trả về ID vì biết là của mình rồi
                        Fingerprint = d.Fingerprint,
                        AccessToken = d.AccessToken,
                        RefreshToken = d.RefreshToken,
                        CreatedAt = d.CreatedAt,
                        LastActive = d.LastUpdatedAt
                    })
                    .ToListAsync();
                if (devicesToDelete == null || devicesToDelete.Count == 0)
                {
                    return responseListDevice.responseObjectSuccess("Không có thiết bị khác để đăng xuất.", new List<DTO_UserDevice>());
                }

                // 4. Thực hiện xóa (Phải query lại Entity để xóa)
                var entitiesToDelete = await dbContext.userDevices
                    .Where(d => d.UserId == userId && d.AccessToken != currentToken)
                    .ToListAsync();

                dbContext.userDevices.RemoveRange(entitiesToDelete);
                await dbContext.SaveChangesAsync();

                return responseListDevice.responseObjectSuccess($"Đã đăng xuất {devicesToDelete.Count} thiết bị khác.", devicesToDelete);
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

                if (context == null)
                {
                    return new ResponseObject<DTO_UserDevice>()
                        .responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Context", null);
                }

                // 1. Lấy UserId từ JWT
                var userIdString = context.User?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString))
                {
                    return new ResponseObject<DTO_UserDevice>()
                        .responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null);
                }

                var userId = Guid.Parse(userIdString);

                // 2. Lấy Access Token hiện tại từ Header
                string currentToken = context.Request.Headers["Authorization"]
                    .ToString()
                    .Replace("Bearer ", "");

                if (string.IsNullOrEmpty(currentToken))
                {
                    return new ResponseObject<DTO_UserDevice>()
                        .responseObjectError(StatusCodes.Status401Unauthorized, "Token không hợp lệ.", null);
                }

                // 3. Lấy userDevice tương ứng với token hiện tại
                var currentDevice = await dbContext.userDevices
                    .FirstOrDefaultAsync(d =>
                        d.UserId == userId &&
                        d.AccessToken == currentToken
                    );

                if (currentDevice == null)
                {
                    return new ResponseObject<DTO_UserDevice>()
                        .responseObjectError(StatusCodes.Status404NotFound,
                        "Không tìm thấy thiết bị để đăng xuất.", null);
                }

                // 4. Xóa accessToken + refreshToken
                currentDevice.AccessToken = null;
                currentDevice.RefreshToken = null;
                currentDevice.LastUpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // 5. Trả về DTO
                var resultDTO = new DTO_UserDevice
                {
                    Id = currentDevice.Id,
                    UserId = currentDevice.UserId,
                    Fingerprint = currentDevice.Fingerprint,
                    AccessToken = null,
                    RefreshToken = null,
                    CreatedAt = currentDevice.CreatedAt,
                    LastActive = currentDevice.LastUpdatedAt
                };

                return new ResponseObject<DTO_UserDevice>()
                    .responseObjectSuccess("Đăng xuất thành công.", resultDTO);
            }
            catch (Exception ex)
            {
                return new ResponseObject<DTO_UserDevice>()
                    .responseObjectError(StatusCodes.Status500InternalServerError,
                    $"Lỗi Server: {ex.Message}", null);
            }
        }

        public async Task<ResponseObject<DTO_UserDevice>> LogoutDevice(Guid deviceId)
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return new ResponseObject<DTO_UserDevice>().responseObjectError(StatusCodes.Status500InternalServerError, "Lỗi Context", null);

                // 1. Check Login
                var userIdString = context.User?.FindFirst("Id")?.Value;
                if (string.IsNullOrEmpty(userIdString))
                {
                    return new ResponseObject<DTO_UserDevice>().responseObjectError(StatusCodes.Status401Unauthorized, "Bạn chưa đăng nhập.", null);
                }
                var userId = Guid.Parse(userIdString);

                // 2. Tìm thiết bị (Check đúng ID và đúng Chủ sở hữu)
                var targetDevice = await dbContext.userDevices
                    .FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId);

                if (targetDevice == null)
                {
                    return new ResponseObject<DTO_UserDevice>().responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy thiết bị.", null);
                }

                // 3. Tạo DTO kết quả (Làm bước này TRƯỚC khi xóa/sửa để giữ lại thông tin)
                var resultDTO = new DTO_UserDevice
                {
                    Id = targetDevice.Id,
                    UserId = targetDevice.UserId, // Hoặc User = targetDevice.UserId tùy tên biến DTO của ông
                    Fingerprint = targetDevice.Fingerprint,
                    AccessToken = null, // Vì sắp logout nên trả về null cho đúng ngữ cảnh
                    RefreshToken = null,
                    CreatedAt = targetDevice.CreatedAt,
                    LastActive = DateTime.UtcNow // Thời điểm bị đá
                };

                // 4. Thực hiện Đăng xuất

                // CÁCH A: XÓA HẲN (Hard Delete - Khuyên dùng cho chức năng "Đá thiết bị")
                dbContext.userDevices.Remove(targetDevice);

                // CÁCH B: CẬP NHẬT NULL (Soft Delete - Nếu ông muốn giữ lịch sử)
                // targetDevice.AccessToken = null;
                // targetDevice.RefreshToken = null;
                // targetDevice.LastUpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();

                // 5. Trả về thông tin thiết bị vừa bị xử lý
                return new ResponseObject<DTO_UserDevice>().responseObjectSuccess("Đăng xuất thiết bị thành công.", resultDTO);
            }
            catch (Exception ex)
            {
                return new ResponseObject<DTO_UserDevice>().responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi Server: {ex.Message}", null);
            }
        }

    }
}
