using System.Collections.Concurrent;

namespace AutoBotCleanArchitecture.Infrastructure.Hubs
{
    public class UserConnectionManager
    {
        private readonly ConcurrentDictionary<string, string> _userConnections = new ConcurrentDictionary<string, string>();

        public int ConnectionCount => _userConnections.Count;

        public bool TryAddConnection(string userId, string connectionId)
        {
            return _userConnections.TryAdd(userId, connectionId);
        }

        public bool TryRemoveConnection(string userId, out string connectionId)
        {
            return _userConnections.TryRemove(userId, out connectionId);
        }

        public bool TryGetConnection(string userId, out string connectionId)
        {
            return _userConnections.TryGetValue(userId, out connectionId);
        }
    }

}
