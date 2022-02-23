using System.Collections.Generic;
using SU_COIN_BACK_END.Models;
namespace SU_COIN_BACK_END.DTOs
{
    public class UserDTO
    {
        public string Name{get; set;}
        public string Surname {get; set;}
        public string Address {get; set;} = null;
        public int SUNET_ID {get; set;} = -1;
        public string MailAddress {get; set;}
        public string Username {get; set;}
        public List<ProjectPermission> Invitations{get; set;} = null;
    }
}