using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SU_COIN_BACK_END.Data;

namespace SU_COIN_BACK_END.Attributes
{
 /*   public class IsOwnerOfTheProject : AuthorizationHandler<IsOwnerOfTheProject>, IAuthorizationRequirement
    {   
        private readonly DataContext _dbContext;
        public IsOwnerOfTheProject(DataContext dataContext)
        {
            _dbContext = dataContext;
        }
        public async override void Handle(AuthorizationHandlerContext context, IsOwnerOfTheProject requirement)
        {
            try{
            if(!context.User.HasClaim(c => c.Type == ClaimTypes.NameIdentifier)){
                context.Fail();
                return;
            }
            var Id = context.User.FindFirst(c => c.Type == ClaimTypes.NameIdentifier).Value;
            var 
            }catch(Exception e){
                context.Fail();
                return;
            }
        }
    }*/
}