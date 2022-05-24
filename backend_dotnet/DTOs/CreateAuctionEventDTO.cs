using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace SU_COIN_BACK_END.DTOs
{
    [Event("CreateAuctionEvent")]
    public class CreateAuctionEventDTO : IEventDTO
    {
        [Parameter("address", "creator", 1, true)]
        public string Creator {get; set;}

        [Parameter("address", "auction", 2, false)]
        public string Auction {get; set;}

        [Parameter("string", "auctionType", 3, false)]
        public string AuctionType {get; set;}
        
        [Parameter("bytes32", "fileHash", 4, false)]
        public byte[] FileHash { get; set; }
    }
}