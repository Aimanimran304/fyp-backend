export const predictPeak = async (Reservation,date,time) => {

 const reservations = await Reservation.countDocuments({
   date,
   timeSlot: time
 })

 if(reservations > 10){
   return "High Occupancy"
 }

 if(reservations > 5){
   return "Moderate Occupancy"
 }

 return "Low Occupancy"

}