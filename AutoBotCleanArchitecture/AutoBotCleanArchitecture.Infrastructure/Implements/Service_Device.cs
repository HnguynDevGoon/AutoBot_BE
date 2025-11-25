using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.Device;
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

        public async Task<List<DTO_UserDevice>> GetDevices(Request_GetDevices request)
        {
            var devices = await dbContext.userDevices
                .Where(d => d.UserId == request.UserId)
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

            // Trả về danh sách rỗng nếu không có thiết bị
            if (devices == null || devices.Count == 0)
                devices = new List<DTO_UserDevice>();

            return devices;
        }

        public async Task<List<DTO_UserDevice>> GetAccessTokens(Guid userId)
        {
            if (userId == Guid.Empty)
                return new List<DTO_UserDevice>();

            var devices = await dbContext.userDevices
                .Where(d => d.UserId == userId)
                .Select(d => new DTO_UserDevice
                {
                    AccessToken = d.AccessToken,
                    RefreshToken = d.RefreshToken,
                })
                .ToListAsync();

            return devices;
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
    }
}
