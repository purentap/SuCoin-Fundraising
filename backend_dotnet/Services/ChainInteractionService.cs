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
                if (allEvents != null) // user registered projects so far
                {
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = allEvents;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>>> GetWhiteListInsertEventLogs(string address)
        {
            ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>> response = new ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>>();
            try
            {
                var whitelistInsertEventHandler = _web3.Eth.GetEvent<WhitelistInsertEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistInsertEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistInsertEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                if (allEvents != null) // user has been inserted into the whitelist before
                {
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = allEvents;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }  
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>>> GetWhiteListRemoveEventLogs(string address)
        {
            ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>> response = new ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>>();
            try
            {
                var whitelistRemoveEventHandler = _web3.Eth.GetEvent<WhitelistRemoveEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllWhitelistEvents = whitelistRemoveEventHandler.CreateFilterInput(address);
                var allEvents = await whitelistRemoveEventHandler.GetAllChangesAsync(filterAllWhitelistEvents);
                if (allEvents != null) // user has beem removed from the whitelist before
                {
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = allEvents;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }  
            } 
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<string> GetChainRole(string address)
        {
            try
            {
                var ABI = @"[{ ""inputs"": [ { ""internalType"": ""address"", ""name"": """", ""type"": ""address"" } ], ""name"": ""statusList"", ""outputs"": [ { ""internalType"": ""enum ProjectRegister.USER_STATUS"", ""name"": """", ""type"": ""uint8"" } ], ""stateMutability"": ""view"", ""type"": ""function"" }]";
               var contract = _web3.Eth.GetContract(ABI,ContractConstants.RegisterContractAddress);

            
               
            int status = await contract.GetFunction("statusList").CallAsync<int>(address);

            Console.WriteLine(status);

               switch (status){
                   case 1:
                    return UserRoleConstants.WHITELIST;
                   case 2:
                    return UserRoleConstants.BLACKLIST;
                   default:
                    return UserRoleConstants.BASE;
               }
            
            } 
            catch (Exception e)
            {
                string error = e.Message;
                Console.WriteLine("Error: {0}",error);
                return "Base";
            }
        }
    
        public async Task<ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>>> GetProjectEvaluationEventLogs()
        {
            ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response = new ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>>();
            try
            {
                var whitelistInsertEventHandler = _web3.Eth.GetEvent<ProjectEvaluationEventDTO>(ContractConstants.RegisterContractAddress);
                var filterAllProjEvalEvents = whitelistInsertEventHandler.CreateFilterInput();
                var allEvents = await whitelistInsertEventHandler.GetAllChangesAsync(filterAllProjEvalEvents);
                if (allEvents != null) // projects have been evaluated before
                {
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = allEvents;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.EVENT_NOT_FOUND;
                }  
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

    }
}