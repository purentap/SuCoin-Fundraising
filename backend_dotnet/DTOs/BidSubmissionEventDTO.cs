using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("BidSubmission")]
    public class BidSubmissionEventDTO : IEventDTO
    {
        [Parameter("address", "sender", 1, true)]
        public string Sender {get; set;}

        [Parameter("uint256", "amount", 2, false)]
        public uint Amount {get; set;}
    }
}