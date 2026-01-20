using Microsoft.AspNetCore.Http;
using System;
using System.Security.Claims;

namespace AutoBotCleanArchitecture.Infrastructure.Helper
{
    public static class TokenHelper
    {
        public static Guid GetUserIdFromToken(HttpContext context)
        {
            // 1. Check coi có User không
            if (context?.User == null) return Guid.Empty;

            // 2. Lấy Claim có key là "Id" 
            var userIdString = context.User.FindFirst("Id")?.Value;

            // 3. Parse sang Guid
            if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
            {
                return userId;
            }

            // 4. Không có thì trả về rỗng
            return Guid.Empty;
        }

        // Tiện tay làm thêm cái lấy Role luôn
        public static string GetRoleFromToken(HttpContext context)
        {
            return context?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }
    }
}