using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("ClaimTokens")]
    public class ClaimTokensEventDTO : IEventDTO
    {
        [Parameter("address", "receiver", 1, true)]
        public uint Round {get; set;}

        [Parameter("uint", "amount", 2, false)]
        public uint Amount {get; set;}
    }
}