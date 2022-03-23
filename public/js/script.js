async function getDateTime(target) {
  const chosenDate = target.value;
  const reserveNowButton = document.getElementById("reserve-now-button")

  const res = await axios({
    method: 'post',
    url: "/getdatetime",
    credentials: "include",
    data: {
      chosenDate: chosenDate
    }
  })

  const { timeList } = res.data


  if(!timeList.length) {
    const timeSlotCol = document.getElementById("time-slot-col");
    reserveNowButton.setAttribute("disabled", "")

    timeSlotCol.innerHTML = `<input type="text" value = "Fully Booked" class = "form-control disabled" disabled>`
  }else{
    const timeSelect = document.getElementById("time-select");
    let content = ""

    for(let t of timeList){
      content += ` <option value="${t}">${t}</option>`
    }
  reserveNowButton.removeAttribute("disabled")
    timeSelect.innerHTML = `<option selected>Select Time</option>${content}`
  }

}

const dateField = document.getElementById("date-field")


dateField.addEventListener("change", e => {
  getDateTime(e.target)
})

