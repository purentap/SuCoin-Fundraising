using System;

namespace SU_COIN_BACK_END.Request
{
    public class UserLoginRequest
    {
        public string? Address { get; set; } = null;
        public string? SignedMessage { get; set; } = null;
    }
}