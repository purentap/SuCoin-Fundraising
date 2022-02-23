using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace SU_COIN_BACK_END.DTOs
{
    [Event("TokenCreation")]
    public class TokenCreationEventDTO : IEventDTO
    {
        [Parameter("address", "creator", 1, true)]
        public string Creator {get; set;}

        [Parameter("string", "Name", 2, false)]
        public string Name {get; set;}

        [Parameter("string", "Symbol", 3, false)]
        public string Symbol {get; set;}

        [Parameter("address", "token", 4, true)]
        public string TokenAddress {get; set;}
    }
}