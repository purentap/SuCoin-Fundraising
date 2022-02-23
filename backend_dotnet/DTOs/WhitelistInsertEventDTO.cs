using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("WhitelistInsert")]
    public class WhitelistInsertEventDTO : IEventDTO
    {
        [Parameter("address", "user", 1, true)]
        public string User {get; set;}
    }
}