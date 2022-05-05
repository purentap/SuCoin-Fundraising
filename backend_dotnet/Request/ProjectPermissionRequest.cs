using SU_COIN_BACK_END.Constants.UserPermissionRoleConstants;

namespace SU_COIN_BACK_END.Request
{
    public class ProjectPermissionRequest
    {
        public int ProjectID { get; set; }
        public string? Username { get; set; }
        public string Role { get; set; } = UserPermissionRoleConstants.EDITOR;
        public Boolean IsAccepted { get; set; }
    }
}