
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("Vote")]
    public class VoteEventDTO : IEventDTO
    {
        [Parameter("bytes32", "project", 1, true)]
        public byte[] Hash {get; set;}

        [Parameter("address", "from", 2, false)]
        public string From {get; set;}

        [Parameter("bool", "decision", 3, false)]
        public bool Decision {get; set;}

        [Parameter("uint", "weight", 4, false)]
        public uint Weight {get; set;}

    }
}