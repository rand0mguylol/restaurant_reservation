// Changes the delete form's action based on the chosen booking.
function attachDelete(target){
  const deleteForm = document.getElementById("delete-form")
  const bookingCode = target.dataset.bc

  deleteForm.action = `/booking/${bookingCode}?_method=DELETE`;
}


// Get the search results of the booking through contact number or booking code
async function getBooking() {
  const searchBooking = document.getElementById("search-booking").value.trim();
  const bookingTbody = document.getElementById("booking-detail-tbody")
  let date = ''
  let time = ''
  const res = await axios({
    method: 'post',
    url: "/booking",
    credentials: "include",
    data: {
      searchBooking: searchBooking
    }
  })

  const { bookingDetail } = res.data
  bookingTbody.innerHTML = ""
  console.log(bookingDetail)
  if(bookingDetail.length !== 0) {
    for(let booking of bookingDetail){
      let tr = document.createElement("tr")
      for(let key in booking){
        if(key.toLowerCase() === "bookingcode") break
        if(key.toLowerCase() === "bookingtime"){ // Convert time object to string
          let newTime = new Date(booking[key]);
          let hr = newTime.getUTCHours().toString().padStart(2, "0"); // => 9
          let minute = newTime.getUTCMinutes().toString().padStart(2, "0"); // =>  30
    
          booking[key] =  `${hr}:${minute}`
          time = booking[key]
  
        }else if(key.toLowerCase() === "bookingdate"){ // Convert date object to string
          let newDate = new Date(booking[key]);
          let day = newDate.getDate().toString().padStart(2, "0")
          let month = (newDate.getMonth() + 1).toString().padStart(2, "0")
          let year = newDate.getFullYear()
  
          booking[key] =  `${year}-${month}-${day}`
          date = booking[key]
        }
        tr.innerHTML += `<td>${booking[key]}</td>`
      }
  
      if(booking["status"] === "BOOKED"){ // If booking not cancelled, admin can edit or delete it
        tr.innerHTML += `<td><button onclick = attachDelete(this) data-bs-toggle="modal" data-bs-target="#deleteModal" class = "btn" data-bc = "${booking['bookingCode']}" ><i class="fa-solid fa-x"></i></button></td>`
        tr.innerHTML += `<td><a class = "btn" href = "/edit/${booking['bookingCode']}?date=${date}&time=${time}"><i class="fa-solid fa-pen-to-square"></i></a></td>`
      }
      bookingTbody.appendChild(tr)
    }
  }else{ // No booking found
    bookingTbody.innerHTML =`<tr><td colspan = "8">No results found</td></tr>`;
  }
}

const searchButton = document.getElementById("search")
const deleteModal = document.getElementById("deleteModal")

searchButton.addEventListener("click", getBooking)

deleteModal.addEventListener("hidden.bs.modal", () => {
  const deleteForm = document.getElementById("delete-form")
  deleteForm.action = "";
})

