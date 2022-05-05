namespace SU_COIN_BACK_END.Models
{
    public class ProjectPermission
    {
        public int ID { get; set; }
        public int ProjectID { get; set; }
        public int UserID { get; set; }
        public string? Role { get; set; }
        public Boolean IsAccepted { get; set; } = false;
    }
}
