    using Microsoft.AspNetCore.Http;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace AutoBotCleanArchitecture.Infrastructure.Helper
    {
        public class IpAdrress
        {
            public static string GetIpAddress(HttpContext context)
            {
                // Kiểm tra header nếu chạy qua proxy (như Nginx, Cloudflare)
                var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();

                if (string.IsNullOrEmpty(ip))
                {
                    // Lấy trực tiếp
                    ip = context.Connection.RemoteIpAddress?.ToString();
                }

                // Nếu là localhost IPv6 (::1) thì đổi thành 127.0.0.1 cho đẹp
                //if (ip == "::1")
                //{
                //    ip = "127.0.0.1";
                //}

                return ip ?? "Unknown";
            }
        }
    }
