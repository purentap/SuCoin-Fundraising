using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("AuctionStarted")]
    public class AuctionStartedEventDTO : IEventDTO
    {
        [Parameter("uint", "start", 1, false)]
        public uint Start {get; set;}

        [Parameter("uint", "end", 2, false)]
        public uint End {get; set;}
    }
}