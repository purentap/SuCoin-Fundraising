using Nethereum.Web3;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts.CQS;
using Nethereum.Util;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Contracts;
using Nethereum.Contracts.Extensions;
using System.Numerics;

namespace SU_COIN_BACK_END.DTOs
{
    [Event("ProjectEvaluation")]
    public class ProjectEvaluationEventDTO : IEventDTO
    {
        [Parameter("bytes32", "projectHash", 1, true)]
        public byte[] Hash {get; set;}

        [Parameter("bool", "isApproved", 2, false)]
        public bool isApproved {get; set;}        
    }
}