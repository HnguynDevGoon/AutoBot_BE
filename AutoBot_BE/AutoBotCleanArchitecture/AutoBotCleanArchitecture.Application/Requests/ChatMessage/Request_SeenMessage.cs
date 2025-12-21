using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Requests.ChatMessage
{
    public class Request_SeenMessage
    {
       public Guid ChatRoomId { get; set; }
       
    }
}
