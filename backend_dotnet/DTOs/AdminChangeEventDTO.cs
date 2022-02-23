using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
namespace SU_COIN_BACK_END.DTOs
{
    [Event("AdminChange")]
    public class AdminChangeEventDTO : IEventDTO
    {
        [Parameter("address", "from", 1, false)]
        public string From {get; set;}

        [Parameter("address", "to", 2, false)]
        public string To {get; set;}
    }
}