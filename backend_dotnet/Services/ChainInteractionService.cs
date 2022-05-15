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
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Web3 _web3;
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
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents;
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception message: {e.Message}");
                response.Success = false;
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
                response.Success = false;
                return response;
            }
            
            try
            {
                var whitelistInsertEventHandler = _web3.Eth.GetEvent<WhitelistInsertEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistInsertEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistInsertEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                
                if (allEvents == null) // user has not been inserted into the whitelist before
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }

                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents; 
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception message: {e.Message}");
                response.Success = false;
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
                response.Success = false;
                return response;
            }

            try
            {
                var whitelistRemoveEventHandler = _web3.Eth.GetEvent<WhitelistRemoveEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistRemoveEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistRemoveEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                
                if (allEvents == null) // user has not been removed from the whitelist before
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = allEvents; 
            } 
            catch (Exception e)
            {
                Console.WriteLine($"Exception message: {e.Message}");
                response.Success = false;
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> GetChainRole(string address)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                var ABI = @"[{ ""inputs"": [ { ""internalType"": ""address"", ""name"": """", ""type"": ""address"" } ], ""name"": ""statusList"", ""outputs"": [ { ""internalType"": ""enum ProjectRegister.USER_STATUS"", ""name"": """", ""type"": ""uint8"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }]";
                var contract = _web3.Eth.GetContract(ABI, ContractConstants.RegisterContractAddress);

                if (contract == null)
                {
                    response.Message = "There is no contract for the current ABI";
                    response.Success = false;
                    return response;
                }
                
                /* Fetch the status and then determine the role */
                try
                {
                    string chainRole; // role of user in the chain
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
                        default:
                            chainRole = UserRoleConstants.BASE;
                            break;
                    }
                        
                    response.Message = String.Format(MessageConstants.USER_ROLE, chainRole);
                    response.Data = chainRole;
                    response.Success = true;
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Error message: {e.Message}");
                    response.Message =  MessageConstants.USER_ROLE_NOT_FOUND_IN_CHAIN;
                    response.Success = false;
                }                    
            } 
            catch (Exception e)
            {
                Console.WriteLine($"Exception message: {e.Message}");
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
                response.Success = false;
            }
            return response;
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
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                    return response;
                }
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = allEvents;
            }
            catch (Exception e)
            {
                Console.WriteLine($"Exception message: {e.Message}");
                response.Success = false;
                response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
            }
            return response;
        }
    }
}