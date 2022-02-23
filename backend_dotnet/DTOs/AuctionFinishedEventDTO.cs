using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("AuctionFinished")]
    public class AuctionFinishedEventDTO : IEventDTO
    {
        [Parameter("uint", "round", 1, false)]
        public uint Round {get; set;}

        [Parameter("uint", "finalPrice", 2, false)]
        public uint Price {get; set;}
    }
}