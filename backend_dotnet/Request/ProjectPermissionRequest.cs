namespace SU_COIN_BACK_END.Request
{
    public class ProjectPermissionRequest
    {
        public int ProjectID {get; set;}
        public string Username {get; set;}
        public string Role {get; set;}
        public Boolean IsAccepted {get; set;}
    }
}