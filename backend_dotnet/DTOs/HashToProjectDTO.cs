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
    [FunctionOutput]
    public class HashToProjectDTO : IFunctionOutputDTO
    {
        [Parameter("address", "proposer", 1)]
        public virtual string? proposerAddress {get; set;}

        [Parameter("address", "token", 2)]
        public string? tokenAddress {get; set;}        

        [Parameter("address", "auction", 3)]
        public string? auctionAddress {get; set;}    

        [Parameter("string", "auctionType", 4)]
        public string? auctionType {get; set;}            

  
    }    
}