using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_UserDevice
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Fingerprint { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastActive { get; set; }
    }
}
