using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Data
{
    public class MessageHub : Hub
    {
        private readonly UserConnectionManager _connectionManager;

        public MessageHub(UserConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("Id")?.Value ?? "";

            if (!string.IsNullOrEmpty(userId))
            {
                if (_connectionManager.TryGetConnection(userId, out string oldConnectionId))
                {
                    if (!string.IsNullOrEmpty(oldConnectionId))
                    {
                        await Clients.Client(oldConnectionId).SendAsync("ServerMessage", "LOGOUT");
                    }

                    _connectionManager.TryRemoveConnection(userId, out _);
                    _connectionManager.TryAddConnection(userId, Context.ConnectionId);
                }
                else
                {
                    _connectionManager.TryAddConnection(userId, Context.ConnectionId);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("Id")?.Value ?? "";

            if (!string.IsNullOrEmpty(userId))
            {
                _connectionManager.TryRemoveConnection(userId, out _);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}