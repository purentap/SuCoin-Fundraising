using System.Threading.Tasks;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.DTOs;
using System.Linq;
using Nethereum.Contracts;

namespace SU_COIN_BACK_END.SU_COIN_INTERFACE
{
    public interface IChainInteractionService
    {
        Task<ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>>> GetRegisterEventLogs();
        Task<ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>>> GetWhiteListRemoveEventLogs(string address);
        Task<ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>>> GetWhiteListInsertEventLogs(string address);
        Task<ServiceResponse<string>> GetChainRole(string address);
        Task<ServiceResponse<bool>> IsAuctionCreatedInChain(string projectHash);
        Task<ServiceResponse<bool>> IsAuctionStartedInChain(string projectHash);
        Task<ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>>> GetProjectEvaluationEventLogs();
    }
}