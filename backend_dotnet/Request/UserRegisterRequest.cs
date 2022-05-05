namespace SU_COIN_BACK_END.Request
{
    public class UserRegisterRequest
    {
        public string? Name { get; set; } = null;
        public string? Surname { get; set; } = null;
        public string? Username { get; set; } = null;
        public string? MailAddress { get; set; } = null;
        public string? SignedMessage { get; set; } = null;
    }
}