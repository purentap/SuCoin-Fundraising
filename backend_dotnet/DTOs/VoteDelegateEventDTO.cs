using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("VoteDelegate")]
    public class VoteDelegateEventDTO : IEventDTO
    {
        
        [Parameter("address", "from", 1, false)]
        public string From {get; set;}

        [Parameter("address", "to", 2, false)]
        public string To {get; set;}

        [Parameter("bytes32", "project", 3, false)]
        public byte[] Hash {get; set;}

        [Parameter("uint", "weight", 4, false)]
        public uint Weight {get; set;}

    }
}