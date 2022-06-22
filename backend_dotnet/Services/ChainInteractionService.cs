using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using AutoMapper;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.Data;
using SU_COIN_BACK_END.Constants.MessageConstants;
using SU_COIN_BACK_END.Constants.ContractConstants;
using System.Text;
using Nethereum.Web3;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts.CQS;
using Nethereum.Util;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Contracts;
using Nethereum.Contracts.Extensions;
using System.Numerics;
using System.Security.Cryptography;
using SU_COIN_BACK_END.Constants.UserRoleConstants;

namespace SU_COIN_BACK_END.Services
{
    public class ChainInteractionService : IChainInteractionService
    {
        private const bool IsHexLittleEndian = false;
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Web3 _web3;

        private readonly string maestroABI = @"[{ ""inputs"": [{ ""internalType"": ""address"", ""name"": ""_sucoin"", ""type"": ""address"" }, { ""internalType"": ""address"", ""name"": ""_projectManager"", ""type"": ""address"" }, { ""internalType"": ""string[]"", ""name"": ""nameArray"", ""type"": ""string[]"" }, { ""internalType"": ""address[]"", ""name"": ""implementationContracts"", ""type"": ""address[]"" } ], ""stateMutability"": ""nonpayable"", ""type"": ""constructor"" }, { ""anonymous"": false, ""inputs"": [{ ""indexed"": true, ""internalType"": ""address"", ""name"": ""creator"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""address"", ""name"": ""auction"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""string"", ""name"": ""auctionType"", ""type"": ""string"" }, { ""indexed"": false, ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" } ], ""name"": ""CreateAuctionEvent"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [{ ""indexed"": true, ""internalType"": ""address"", ""name"": ""creator"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""string"", ""name"": ""Name"", ""type"": ""string"" }, { ""indexed"": false, ""internalType"": ""string"", ""name"": ""Symbol"", ""type"": ""string"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""token"", ""type"": ""address"" } ], ""name"": ""TokenCreation"", ""type"": ""event"" }, { ""inputs"": [{ ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" }, { ""internalType"": ""string"", ""name"": ""auctionType"", ""type"": ""string"" }, { ""components"": [{ ""internalType"": ""uint256"", ""name"": ""numberOfTokensToBeDistributed"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""rate"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""finalRate"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""limit"", ""type"": ""uint256"" } ], ""internalType"": ""struct Maestro.userAuctionParameters"", ""name"": ""userParams"", ""type"": ""tuple"" } ], ""name"": ""createAuction"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" }, { ""internalType"": ""string"", ""name"": ""tokenName"", ""type"": ""string"" }, { ""internalType"": ""string"", ""name"": ""tokenSymbol"", ""type"": ""string"" }, { ""internalType"": ""uint256"", ""name"": ""initialSupply"", ""type"": ""uint256"" } ], ""name"": ""createToken"", ""outputs"": [{ ""internalType"": ""address"", ""name"": """", ""type"": ""address"" }], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""string"", ""name"": ""name"", ""type"": ""string"" }, { ""internalType"": ""address"", ""name"": ""newImplementationAddress"", ""type"": ""address"" } ], ""name"": ""editImplementation"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""bytes32[]"", ""name"": ""hashes"", ""type"": ""bytes32[]"" }, { ""internalType"": ""enum Auction.AuctionStatus"", ""name"": ""status"", ""type"": ""uint8"" }, { ""internalType"": ""uint256"", ""name"": ""selectCount"", ""type"": ""uint256"" } ], ""name"": ""getProjectSurfaceByStatus"", ""outputs"": [{ ""components"": [{ ""internalType"": ""address"", ""name"": ""auction"", ""type"": ""address"" }, { ""internalType"": ""string"", ""name"": ""tokenName"", ""type"": ""string"" }, { ""internalType"": ""string"", ""name"": ""tokenSymbol"", ""type"": ""string"" }, { ""internalType"": ""string"", ""name"": ""auctionType"", ""type"": ""string"" }, { ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" } ], ""internalType"": ""struct Maestro.ProjectSurface[]"", ""name"": """", ""type"": ""tuple[]"" }], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" }, { ""internalType"": ""uint256"", ""name"": ""pauseTimeInHours"", ""type"": ""uint256"" } ], ""name"": ""pauseAuction"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" }], ""name"": ""projectTokens"", ""outputs"": [{ ""internalType"": ""address"", ""name"": ""proposer"", ""type"": ""address"" }, { ""internalType"": ""address"", ""name"": ""token"", ""type"": ""address"" }, { ""internalType"": ""address"", ""name"": ""auction"", ""type"": ""address"" }, { ""internalType"": ""string"", ""name"": ""auctionType"", ""type"": ""string"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [{ ""internalType"": ""address"", ""name"": ""newAddress"", ""type"": ""address"" }], ""name"": ""setSucoin"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" } ]";
        private readonly string auctionABI = @"[ { ""anonymous"": false, ""inputs"": [ { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""end"", ""type"": ""uint256"" }, { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""finalPrice"", ""type"": ""uint256"" } ], ""name"": ""AuctionFinished"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""pauseDuration"", ""type"": ""uint256"" } ], ""name"": ""AuctionPaused"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""start"", ""type"": ""uint256"" }, { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""end"", ""type"": ""uint256"" } ], ""name"": ""AuctionStarted"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""address"", ""name"": ""sender"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""amount"", ""type"": ""uint256"" } ], ""name"": ""BidSubmission"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""previousAdminRole"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""newAdminRole"", ""type"": ""bytes32"" } ], ""name"": ""RoleAdminChanged"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""sender"", ""type"": ""address"" } ], ""name"": ""RoleGranted"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""sender"", ""type"": ""address"" } ], ""name"": ""RoleRevoked"", ""type"": ""event"" }, { ""inputs"": [], ""name"": ""DEFAULT_ADMIN_ROLE"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""PROPOSER_ADMIN_ROLE"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""PROPOSER_ROLE"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""uint256"", ""name"": ""bidCoinBits"", ""type"": ""uint256"" } ], ""name"": ""bid"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""bidCoin"", ""outputs"": [ { ""internalType"": ""contract WrapperToken"", ""name"": """", ""type"": ""address"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" } ], ""name"": ""getRoleAdmin"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""getStatus"", ""outputs"": [ { ""internalType"": ""enum Auction.AuctionStatus"", ""name"": """", ""type"": ""uint8"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""grantRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""hasRole"", ""outputs"": [ { ""internalType"": ""bool"", ""name"": """", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""components"": [ { ""internalType"": ""address"", ""name"": ""token"", ""type"": ""address"" }, { ""internalType"": ""address"", ""name"": ""bidCoin"", ""type"": ""address"" }, { ""internalType"": ""uint256"", ""name"": ""numberOfTokensToBeDistributed"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""rate"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""finalRate"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""limit"", ""type"": ""uint256"" } ], ""internalType"": ""struct Auction.auctionParameters"", ""name"": ""params"", ""type"": ""tuple"" } ], ""name"": ""initialize"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""latestEndTime"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": """", ""type"": ""uint256"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""manualFinish"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes[]"", ""name"": ""data"", ""type"": ""bytes[]"" } ], ""name"": ""multicall"", ""outputs"": [ { ""internalType"": ""bytes[]"", ""name"": ""results"", ""type"": ""bytes[]"" } ], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""uint256"", ""name"": ""pauseTimeInHours"", ""type"": ""uint256"" } ], ""name"": ""pauseAuction"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""projectWallet"", ""outputs"": [ { ""internalType"": ""address"", ""name"": """", ""type"": ""address"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""renounceRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""revokeRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""address"", ""name"": ""wallet"", ""type"": ""address"" } ], ""name"": ""setTeamWallet"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""uint256"", ""name"": ""maximumAuctionTimeInHours"", ""type"": ""uint256"" } ], ""name"": ""startAuction"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""startTime"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": """", ""type"": ""uint256"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""status"", ""outputs"": [ { ""internalType"": ""enum Auction.AuctionStatus"", ""name"": """", ""type"": ""uint8"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes4"", ""name"": ""interfaceId"", ""type"": ""bytes4"" } ], ""name"": ""supportsInterface"", ""outputs"": [ { ""internalType"": ""bool"", ""name"": """", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""totalDepositedSucoins"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": """", ""type"": ""uint256"" } ], ""stateMutability"": ""view"", ""type"": ""function"" } ]";
        private readonly string ADMIN_ROLE = Nethereum.Util.Sha3Keccack.Current.CalculateHash("ADMIN_ROLE");
        private readonly string projectABI = @"[ { ""inputs"": [ { ""internalType"": ""uint256"", ""name"": ""_threshold"", ""type"": ""uint256"" } ], ""stateMutability"": ""nonpayable"", ""type"": ""constructor"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": false, ""internalType"": ""address"", ""name"": ""from"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""address"", ""name"": ""to"", ""type"": ""address"" } ], ""name"": ""AdminChange"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" }, { ""indexed"": false, ""internalType"": ""bool"", ""name"": ""isApproved"", ""type"": ""bool"" } ], ""name"": ""ProjectEvaluation"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""address"", ""name"": ""from"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""bytes32"", ""name"": ""projectHash"", ""type"": ""bytes32"" } ], ""name"": ""Register"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""previousAdminRole"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""newAdminRole"", ""type"": ""bytes32"" } ], ""name"": ""RoleAdminChanged"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""sender"", ""type"": ""address"" } ], ""name"": ""RoleGranted"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" }, { ""indexed"": true, ""internalType"": ""address"", ""name"": ""sender"", ""type"": ""address"" } ], ""name"": ""RoleRevoked"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""bytes32"", ""name"": ""project"", ""type"": ""bytes32"" }, { ""indexed"": false, ""internalType"": ""address"", ""name"": ""from"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""bool"", ""name"": ""decision"", ""type"": ""bool"" }, { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""weight"", ""type"": ""uint256"" } ], ""name"": ""Vote"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": false, ""internalType"": ""address"", ""name"": ""from"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""address"", ""name"": ""to"", ""type"": ""address"" }, { ""indexed"": false, ""internalType"": ""bytes32"", ""name"": ""project"", ""type"": ""bytes32"" }, { ""indexed"": false, ""internalType"": ""uint256"", ""name"": ""weight"", ""type"": ""uint256"" } ], ""name"": ""VoteDelegate"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""address"", ""name"": ""user"", ""type"": ""address"" } ], ""name"": ""WhitelistInsert"", ""type"": ""event"" }, { ""anonymous"": false, ""inputs"": [ { ""indexed"": true, ""internalType"": ""address"", ""name"": ""user"", ""type"": ""address"" } ], ""name"": ""WhitelistRemove"", ""type"": ""event"" }, { ""inputs"": [], ""name"": ""ADMIN_ROLE"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""DEFAULT_ADMIN_ROLE"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""address"", ""name"": ""to"", ""type"": ""address"" }, { ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" } ], ""name"": ""delegate"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""address"", ""name"": ""user"", ""type"": ""address"" }, { ""internalType"": ""enum ProjectRegister.USER_STATUS"", ""name"": ""newStatus"", ""type"": ""uint8"" } ], ""name"": ""editUserStatus"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" } ], ""name"": ""getRoleAdmin"", ""outputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""grantRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""hasRole"", ""outputs"": [ { ""internalType"": ""bool"", ""name"": """", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""address"", ""name"": ""addr"", ""type"": ""address"" }, { ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" } ], ""name"": ""isValidToDistribute"", ""outputs"": [ { ""internalType"": ""bool"", ""name"": """", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": """", ""type"": ""bytes32"" } ], ""name"": ""projectsRegistered"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": ""approved"", ""type"": ""uint256"" }, { ""internalType"": ""uint256"", ""name"": ""rejected"", ""type"": ""uint256"" }, { ""internalType"": ""address"", ""name"": ""proposer"", ""type"": ""address"" }, { ""internalType"": ""bool"", ""name"": ""finalized"", ""type"": ""bool"" }, { ""internalType"": ""bool"", ""name"": ""decision"", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" } ], ""name"": ""registerProject"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" } ], ""name"": ""removeProject"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""renounceRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""role"", ""type"": ""bytes32"" }, { ""internalType"": ""address"", ""name"": ""account"", ""type"": ""address"" } ], ""name"": ""revokeRole"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""address"", ""name"": """", ""type"": ""address"" } ], ""name"": ""statusList"", ""outputs"": [ { ""internalType"": ""enum ProjectRegister.USER_STATUS"", ""name"": """", ""type"": ""uint8"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes4"", ""name"": ""interfaceId"", ""type"": ""bytes4"" } ], ""name"": ""supportsInterface"", ""outputs"": [ { ""internalType"": ""bool"", ""name"": """", ""type"": ""bool"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""threshold"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": """", ""type"": ""uint256"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }, { ""inputs"": [ { ""internalType"": ""bytes32"", ""name"": ""fileHash"", ""type"": ""bytes32"" }, { ""internalType"": ""bool"", ""name"": ""decision"", ""type"": ""bool"" } ], ""name"": ""voteProposal"", ""outputs"": [], ""stateMutability"": ""nonpayable"", ""type"": ""function"" }, { ""inputs"": [], ""name"": ""whitelistedCount"", ""outputs"": [ { ""internalType"": ""uint256"", ""name"": """", ""type"": ""uint256"" } ], ""stateMutability"": ""view"", ""type"": ""function"" } ]"; 
        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier));
        private string GetUserAddress() => (_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Surname));
        public ChainInteractionService(IMapper mapper, DataContext context, IHttpContextAccessor httpContextAccessor)
        {
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            var url = "https://speedy-nodes-nyc.moralis.io/7918f6b4c7b9adebcdeb036e/avalanche/testnet";
            _web3 = new Web3(url);
        }

        public async Task<ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>>> GetRegisterEventLogs()
        {
            ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>> response = new ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>>();
            try
            {
                var registerEventHandler = _web3.Eth.GetEvent<ProjectRegisterEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllRegisterEvents = registerEventHandler.CreateFilterInput(GetUserAddress());
                var allEvents = await registerEventHandler.GetAllChangesAsync(filterAllRegisterEvents);
                
                if (allEvents == null) // user has not registered projects so far
                {
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents;
            }
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        public async Task<ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>>> GetWhiteListInsertEventLogs(string address)
        {
            ServiceResponse<string> role_response = new ServiceResponse<string>();
            role_response = await GetChainRole(address);
            ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>> response = new ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>>();
    
            if (role_response.Data != UserRoleConstants.WHITELIST)
            {
                response.Message = MessageConstants.NOT_WHITLISTED;
                return response;
            }
            
            try
            {
                var whitelistInsertEventHandler = _web3.Eth.GetEvent<WhitelistInsertEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistInsertEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistInsertEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                
                if (allEvents == null) // user has not been inserted into the whitelist before
                {
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }

                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents; 
            }
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        public async Task<ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>>> GetWhiteListRemoveEventLogs(string address)
        {
            ServiceResponse<string> role_response = new ServiceResponse<string>();
            role_response = await GetChainRole(address);
            ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>> response = new ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>>();

            if (role_response.Data != UserRoleConstants.WHITELIST)
            {
                response.Message = MessageConstants.NOT_WHITLISTED;
                return response;
            }

            try
            {
                var whitelistRemoveEventHandler = _web3.Eth.GetEvent<WhitelistRemoveEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistRemoveEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistRemoveEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                
                if (allEvents == null) // user has not been removed from the whitelist before
                {
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents; 
            } 
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> GetChainRole(string address)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                var contract = _web3.Eth.GetContract(projectABI, ContractConstants.RegisterContractAddress);

                if (contract == null)
                {
                    response.Message = MessageConstants.CONTRACT_NOT_FOUND;
                    return response;
                }
                
                /* Fetch the status and then determine the role */
                try
                {
                    string chainRole; // role of user in the chain
                    Console.WriteLine(address); // Debuging
                    bool isAdmin = await contract.GetFunction("hasRole").CallAsync<bool>(ADMIN_ROLE.HexToByteArray(),address);

                    if (isAdmin)
                    {
                        chainRole = UserRoleConstants.ADMIN;
                    }
                    else 
                    {
                        int status = await contract.GetFunction("statusList").CallAsync<int>(address);
                        Console.WriteLine($"Status: {status}"); // Debuging

                        switch (status)
                        {
                            case 1:
                                chainRole = UserRoleConstants.WHITELIST;
                                break;
                            case 2:
                                chainRole = UserRoleConstants.BLACKLIST;
                                break;
                            case 3:
                                chainRole = UserRoleConstants.VIEWER;
                                break;
                            default:
                                chainRole = UserRoleConstants.BASE;
                                break;
                        }
                    }

                    response.Message = $"User Role: {chainRole}";
                    response.Data = chainRole;
                    response.Success = true;
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                    response.Message =  MessageConstants.USER_ROLE_NOT_FOUND_IN_CHAIN;
                }                    
            } 
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        private async Task<ServiceResponse<string>> GetAuctionFromHash(string projectHash) 
        {
            ServiceResponse<string> response = new ServiceResponse<string>();

            try 
            {
                var contract = _web3.Eth.GetContract(maestroABI, ContractConstants.MaestroContractAddress);

                if (contract == null)
                {
                    response.Message = MessageConstants.CONTRACT_NOT_FOUND;
                    return response;
                }

                try
                {
                    var hashValue =  Convert.FromHexString(projectHash);
                    var project = await contract.GetFunction("projectTokens").CallDeserializingToObjectAsync<HashToProjectDTO>(hashValue);

                    if (HexBigIntegerConvertorExtensions.HexToBigInteger(project.proposerAddress, IsHexLittleEndian) == 0)
                    {
                        response.Message = MessageConstants.AUCTION_NOT_FOUND;
                        response.Data = $"Project does not exist for {projectHash}";
                        return response;
                    }
                    else
                    {
                        response.Message = MessageConstants.OK;
                        response.Data = project.auctionAddress;
                        response.Success = true;
                    }
                }
                catch (Exception)
                {   
                    response.Message =  MessageConstants.PROJECT_NOT_FOUND_IN_CHAIN;
                }
            }
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }

            return response;
        }

        public async Task<ServiceResponse<bool>> IsAuctionCreatedInChain(string projectHash)
        {
            var projectResponse = await GetAuctionFromHash(projectHash);
            ServiceResponse<bool> auctionResponse = new ServiceResponse<bool>();
            var projectFound = projectResponse.Success; // project who has an auction

            if (projectFound) 
            {
                auctionResponse.Message = MessageConstants.OK;
                auctionResponse.Success = projectFound;
                auctionResponse.Data = true;
            }

            else 
            {
                /* If everything goes fine in the GetAuctionFromHash method and result is auction is not created 
                  then it means that method successfully worked and determined that the auction for the current project
                  has not been created yet * */
                string? projectResponse_message = projectResponse.Message;
                if (projectResponse_message == MessageConstants.AUCTION_NOT_FOUND)
                {
                    auctionResponse.Success = true;
                }
                auctionResponse.Message = projectResponse.Message;
                                        
            }

            return auctionResponse;
        }

         public async Task<ServiceResponse<bool>> IsAuctionStartedInChain(string projectHash)
        {
            var projectResponse = await GetAuctionFromHash(projectHash);
            ServiceResponse<bool> auctionStartedResponse = new ServiceResponse<bool>();
            var projectFound = projectResponse.Success;

            if (!projectFound) 
            {
                auctionStartedResponse.Message = projectResponse.Message;
                return auctionStartedResponse;
            }

            try 
            {
                var address = projectResponse.Data;
                var contract = _web3.Eth.GetContract(auctionABI, address);
                var auctionStatus = await contract.GetFunction("status").CallAsync<int>();

                /* If everything goes fine in the until there 
                  method works successfully, then determine whether the auction has been started or not * */

                auctionStartedResponse.Success = true;

                if (auctionStatus == 0)
                {
                    auctionStartedResponse.Message = MessageConstants.AUCTION_NOT_STARTED;
                }
                else
                {
                    auctionStartedResponse.Data = true;
                    auctionStartedResponse.Message = MessageConstants.OK;
                }
            }
            catch (Exception) 
            {
                auctionStartedResponse.Message = MessageConstants.AUCTION_NOT_FOUND;
            }

            return auctionStartedResponse;
        }
    
        public async Task<ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>>> GetProjectEvaluationEventLogs()
        {
            ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response = new ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>>();
            try
            {
                var whitelistInsertEventHandler = _web3.Eth.GetEvent<ProjectEvaluationEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllProjEvalEvents = whitelistInsertEventHandler.CreateFilterInput();
                var allEvents = await whitelistInsertEventHandler.GetAllChangesAsync(filterAllProjEvalEvents);
                if (allEvents == null) // projects have not been evaluated before
                {
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents;
            }
            catch (Exception)
            {
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        
    }
}