
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("Register")]
    public class ProjectRegisterEventDTO : IEventDTO
    {
        [Parameter("address", "from", 1, true)]
        public string From {get; set;}

        [Parameter("bytes32", "projectHash", 2, false)]
        public byte[] Hash {get; set;}

    }
}