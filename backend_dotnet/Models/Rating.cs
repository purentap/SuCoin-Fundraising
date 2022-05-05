namespace SU_COIN_BACK_END.Models
{
    public class Rating
    {
        public int ID { get; set; }
        public int ProjectID { get; set; }
        public int UserID { get; set; }    
        public double Rate { get; set; } 
    }
}