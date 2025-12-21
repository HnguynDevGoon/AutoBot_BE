using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ChatMessage
{
    public class Request_GetResources
    {
        public Guid ChatRoomId { get; set; }
        public string TypeResource { get; set; }
    }
}
