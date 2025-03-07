/*==================== CLOCK ====================*/
const hour = document.getElementById("clock-hour"),
	minutes = document.getElementById("clock-minutes"),
	seconds = document.getElementById("clock-seconds");
	hours = document.getElementById("clock-hour");

let lastSecond = -1;
let lastMinute = -1;
let lastHour = -1;
let date = new Date();

const syncDateTime = () => {
    fetch("/server-date")
        .then((response) => response.json())
        .then((data) => {
            date.setTime(new Date(data.serverDate).getTime());
        })
        .catch((error) => console.error("Error fetching server date:", error));
};

// Initialize and sync every minute
syncDateTime();
setInterval(syncDateTime, 60000);

const serverTime = () => {
	fetch("/server-time")
		.then((response) => response.json())
		.then((data) => {
			const serverTime = data.serverTime.split(":");
			date.setHours(serverTime[0], serverTime[1], serverTime[2], 0);
		})
		.catch((error) => console.error("Error fetching server time:", error));
};

const clock = () => {
	let hh = date.getHours() * 30,
		mm = date.getMinutes() * 6,
		ss = date.getSeconds() * 6 + date.getMilliseconds() * 0.006; // Add milliseconds for smooth transition

	// We add a rotation to the elements
	hour.style.transform = `rotateZ(${hh + mm / 12}deg)`;
	minutes.style.transform = `rotateZ(${mm}deg)`;

	// Check if the seconds hand needs to reset
	if (date.getSeconds() !== lastSecond) {
		seconds.style.transition =
			date.getSeconds() === 0 ? "none" : "transform 0.05s linear";
		lastSecond = date.getSeconds();
	}

	// Check if the minutes hand needs to reset
	if (date.getMinutes() !== lastMinute) {
		minutes.style.transition =
			date.getMinutes() === 0 ? "none" : "transform 0.05s linear";
		lastMinute = date.getMinutes();
	}	

	// Check if the hours hand needs to reset
	if (date.getHours() !== lastHour) {
		hours.style.transition =
			date.getHours() === 0 ? "none" : "transform 0.05s linear";
		lastHour = date.getHours();
	}

	seconds.style.transform = `rotateZ(${ss}deg)`;

	// Increment the local date object by 50ms
	date = new Date(date.getTime() + 50);
};

// Fetch the server time once
serverTime();

// Update the clock every 50ms for smoother updates
setInterval(clock, 50);

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") {
		serverTime();
	}
});

/*==================== CLOCK & DATE TEXT ====================*/
const textHour = document.getElementById("text-hour"),
	textMinutes = document.getElementById("text-minutes"),
	textAmPm = document.getElementById("text-ampm"),
	dateDay = document.getElementById("date-day"),
	dateMonth = document.getElementById("date-month"),
	dateYear = document.getElementById("date-year");

let serverDate; // Store the server date

const updateClockText = () => {
    if (!serverDate) return; // Ensure serverDate is available

    serverDate.setSeconds(serverDate.getSeconds() + 1); // Increment by one second

    let hh = serverDate.getHours();
    let ampm;
    let mm = serverDate.getMinutes();
    let day = serverDate.getDate();
    let month = serverDate.getMonth();
    let year = serverDate.getFullYear();

    // We change the hours from 24 to 12 hours and establish whether it is AM or PM
    if (hh >= 12) {
        hh = hh - 12;
        ampm = "PM";
    } else {
        ampm = "AM";
    }

    // We detect when it's 0 AM and transform to 12 AM
    if (hh == 0) {
        hh = 12;
    }

    // Show a zero before hours
    textHour.innerHTML = `${hh < 10 ? `0${hh}` : hh}:`;

    // Show a zero before the minutes
    textMinutes.innerHTML = mm < 10 ? `0${mm}` : mm;

    // Show AM or PM
    textAmPm.innerHTML = ampm;

    // Show the day, month, and year
    dateDay.innerHTML = day;
    dateMonth.innerHTML = month + 1; // Months are zero-based
    dateYear.innerHTML = year;
};

const fetchServerTime = () => {
    fetch("/server-time") // Fetch time from the server
        .then((response) => response.json())
        .then((data) => {
            const serverTime = data.serverTime; // Server time returned from the API

            // Convert the server time string to a Date object
            const [hours, minutes, seconds] = serverTime.split(":").map(Number);
            serverDate = new Date();
            serverDate.setHours(hours, minutes, seconds);

            updateClockText(); // Initial update
        })
        .catch((error) => console.error("Error fetching server time:", error));
};

// Fetch the server time once initially
fetchServerTime();

// Fetch the server time every 1 minute
setInterval(fetchServerTime, 60000);

// Update the clock every 1000ms
setInterval(updateClockText, 1000);

/*==================== DARK/LIGHT THEME ====================*/
const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "bxs-sun";

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () =>
	document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () =>
	themeButton.classList.contains(iconTheme) ? "bxs-moon" : "bxs-sun";

// We validate if the user previously chose a topic
if (selectedTheme) {
	// If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark theme
	document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
		darkTheme
	);
	themeButton.classList[selectedIcon === "bxs-moon" ? "add" : "remove"](
		iconTheme
	);
}

// Modal Hide
// Get the modal
var modal = document.getElementById("add_alarm_modal");
var modalContent = document.querySelector(".modal-content");

// Function to open the modal
// Function to open the modal
function openModal(isEditing = false) {
    if (!isEditing) {
        // Clear the form if not editing
        document.getElementById("new-alarm-time").value = "";
        document.getElementById("new-alarm-label").value = "";
        document.getElementById("new-alarm-duration").value = "";
        document.getElementById("new-alarm-repeat").value = "";
		document.getElementById("new-alarm-delay").value = "";
    }

    modal.style.display = "flex";
    modalContent.classList.add("show-modal");

    // Add delete button if editing
    if (isEditing) {
        let deleteButton = document.getElementById("delete-alarm-btn");
        if (!deleteButton) {
            deleteButton = document.createElement("button");
            deleteButton.id = "delete-alarm-btn";
            deleteButton.className = "btn";
            deleteButton.textContent = "Delete Alarm";
            modalContent.appendChild(deleteButton);

            deleteButton.addEventListener("click", () => {
                const editIndex = modalContent.dataset.editIndex;
                if (editIndex !== undefined) {
                    removeAlarm(parseInt(editIndex));
                    closeModal();
                }
            });
        }
    } else {
        // Remove delete button if it exists
        const deleteButton = document.getElementById("delete-alarm-btn");
        if (deleteButton) {
            deleteButton.remove();
        }
    }
}

var setTimeModal = document.getElementById("set_time_modal");

function openSetTimeModal (isEditing = false) {
	if (!isEditing) {
		// Clear the form if not editing
		document.getElementById("time-input").value = "";
	}
	setTimeModal.style.display = "flex";
	modalContent.classList.add("show-modal");
}
// Function to close the modal
function closeModal() {
    console.log("Closing modal");
    modalContent.classList.remove("show-modal");
    modalContent.classList.add("scale-out-center");
    setTimeout(() => {
        modal.style.display = "none";
        setTimeModal.style.display = "none";
        modalContent.classList.remove("scale-out-center");
    }, 500); // Duration of the scale-out-center animation
}

// Close the modal when clicking outside of it
window.onclick = function (event) {
    console.log("Window clicked:", event.target);
    if (event.target == modal || event.target == setTimeModal) {
        closeModal();
    }
};

// Activate / deactivate the theme manually with the button
themeButton.addEventListener("click", () => {
	// Add or remove the dark / icon theme
	document.body.classList.toggle(darkTheme);
	themeButton.classList.toggle(iconTheme);
	// We save the theme and the current icon that the user chose
	localStorage.setItem("selected-theme", getCurrentTheme());
	localStorage.setItem("selected-icon", getCurrentIcon());
});

/*==================== MODAL ANIMATION ====================*/

// Get the modal
var modal = document.getElementById("add_alarm_modal");
var modalContent = document.querySelector(".modal-content");

// Function to close the modal
function closeModal() {
	modalContent.classList.remove("show-modal");
	modalContent.classList.add("scale-out-center");
	setTimeout(() => {
		modal.style.display = "none";
		setTimeModal.style.display = "none";
		modalContent.classList.remove("scale-out-center");
	}, 500); // Duration of the scale-out-center animation
}

// Close the modal when clicking outside of it
window.onclick = function (event) {
	if (event.target == modal) {
		closeModal();
	}
};
/*==================== MODAL ANIMATION ====================*/

/*=========================ALARM===========================*/

let alarms = [];

// Fetch the alarms from the server on page load
fetch("/alarms.json")
	.then((response) => response.json())
	.then((data) => {
		alarms = data || [];
		renderAlarms();
	})
	.catch((error) => {
		console.error("Error loading alarms:", error);
		alert("Error loading alarms. Please try again later.");
	});

window.addEventListener("DOMContentLoaded", () => {
	const now = new Date();

	// Prefill the checkbox for the current day
	const currentDay = now.getDay();
	const checkboxes = document.querySelectorAll(
		'.weekday-selector input[type="checkbox"]'
	);
	checkboxes.forEach((checkbox) => {
		if (parseInt(checkbox.value, 10) === currentDay) {
			checkbox.checked = true;
		}
	});
});

document.addEventListener("DOMContentLoaded", () => {
	const loader = document.querySelector(".loader");
	const clockContainer = document.querySelector(".clock.container");

	// Show the loader for the first 2 seconds
	setTimeout(() => {
		loader.style.display = "none"; // Hide the loader
		clockContainer.style.display = "block"; // Show the clock container
		clockContainer.classList.add("slide-in-bck-center"); // Add the animation class
	}, 3500); // 3500ms = 3.5 seconds
});

const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

function renderAlarms() {
	let isHolding = false;
	let holdTimeout;

	document.addEventListener("mousedown", () => {
		holdTimeout = setTimeout(() => {
			isHolding = true;
		}, 300);
	});

	document.addEventListener("mouseup", () => {
		clearTimeout(holdTimeout);
		isHolding = false;
	});

	window.handleClick = function (index) {
		if (!isHolding) {
			editAlarm(index);
		}
	};

	const alarmList = document.getElementById("alarm-list");
	alarmList.innerHTML = ""; // Clear existing list

	const getWeekdaysText = (weekdays) => {
		if (weekdays.length === 7) {
			return "Everyday";
		}

		const sequences = [];
		let start = weekdays[0];
		let end = weekdays[0];

		for (let i = 1; i < weekdays.length; i++) {
			if (weekdays[i] === end + 1 || (end === 6 && weekdays[i] === 0)) {
				end = weekdays[i];
			} else {
				sequences.push({ start, end });
				start = weekdays[i];
				end = weekdays[i];
			}
		}
		sequences.push({ start, end });

		return sequences
			.map((seq) => {
				if (seq.start === seq.end) {
					return days[seq.start];
				} else {
					return `${days[seq.start]} to ${days[seq.end]}`;
				}
			})
			.join(", ");
	};

	alarms.forEach((alarm, index) => {
		let [hour, minute] = alarm.time.split(":").map(Number);
		const ampm = hour >= 12 ? "PM" : "AM";
		hour = hour % 12 || 12; // Convert 0 to 12 for midnight
		const formattedTime = `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;

		const li = document.createElement("div");
		li.className = `alarm-item ${!alarm.active ? "disabled" : ""}`;
		li.innerHTML = `
            <div class="alarm_item_background" onClick="handleClick(${index})"></div>
            <div id="alarm-text" onClick="handleClick(${index})">
                <strong>${formattedTime}</strong> - ${alarm.label}<br>
                <small>${getWeekdaysText(alarm.weekdays)}</small>
            </div>
            
            
            <label class="switch">
                <input type="checkbox" id="${index}" ${
			alarm.active ? "checked" : ""
		}>
                <span class="slider" for="${index}"></span>
        `;

		alarmList.appendChild(li);
		const checkbox = li.querySelector('input[type="checkbox"]');
		checkbox.addEventListener("change", () => toggleAlarm(index));

		// Add event listeners for holding down the alarm item
		let holdTimeout;

		const revertChanges = () => {
			// Revert the changes made when the alarm item is held down
			li.style.transform = "scale(1)";
			li.style.backgroundColor = "";
			const removeAlarmButton = document.querySelector(
				".footer .remove-alarm-btn"
			);
			if (removeAlarmButton) {
				removeAlarmButton.outerHTML = `
					<button
						id="add-alarm"
						class="clock__add__alarm bx bxs-alarm-add"
						popovertarget="add_alarm_modal"
						onclick="openModal()"
					></button>
				`;
			}
		};

		const startHold = () => {
			clicks = 0;
			holdTimeout = setTimeout(() => {
				// Action to perform when the alarm item is held down
				li.style.transform = "scale(0.95)";
				li.style.backgroundColor = "rgba(14, 127, 233, 0.301)";
				li.setAttribute("draggable", "true");

				const addAlarmElement = document.querySelector(".footer #add-alarm");
				if (addAlarmElement) {
					addAlarmElement.outerHTML = `
						<button class="remove-alarm-btn bin-button" id="remove-alarm2">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 39 7" class="bin-top">
								<line stroke-width="4" stroke="white" y2="5" x2="39" y1="5"></line>
								<line stroke-width="3" stroke="white" y2="1.5" x2="26.0357" y1="1.5" x1="12"></line>
							</svg>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 33 39" class="bin-bottom">
								<mask fill="white" id="path-1-inside-1_8_19">
									<path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
								</mask>
								<path mask="url(#path-1-inside-1_8_19)" fill="white" d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"></path>
								<path stroke-width="4" stroke="white" d="M12 6L12 29"></path>
								<path stroke-width="4" stroke="white" d="M21 6V29"></path>
							</svg>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 89 80" class="garbage">
								<path fill="white" d="M20.5 10.5L37.5 15.5L42.5 11.5L51.5 12.5L68.75 0L72 11.5L79.5 12.5H88.5L87 22L68.75 31.5L75.5066 25L86 26L87 35.5L77.5 48L70.5 49.5L80 50L77.5 71.5L63.5 58.5L53.5 68.5L65.5 70.5L45.5 73L35.5 79.5L28 67L16 63L12 51.5L0 48L16 25L22.5 17L20.5 10.5Z"></path>
							</svg>
						</button>
					`;

					const newRemoveAlarmButton = document.querySelector(
						".footer .remove-alarm-btn"
					);
					if (newRemoveAlarmButton) {
						newRemoveAlarmButton.addEventListener("click", () => {
							removeAlarm(index);
							revertChanges();
						});

						newRemoveAlarmButton.addEventListener("dragenter", (e) => {
							e.preventDefault();
							newRemoveAlarmButton.style.backgroundColor =
								"rgba(255, 0, 0, 0.5)";
						});

						newRemoveAlarmButton.addEventListener("dragover", (e) => {
							e.preventDefault();
						});

						newRemoveAlarmButton.addEventListener("dragleave", () => {
							newRemoveAlarmButton.style.backgroundColor = "";
						});

						newRemoveAlarmButton.addEventListener("drop", (e) => {
							e.preventDefault();
							newRemoveAlarmButton.style.backgroundColor = "";
							li.style.transition = "opacity 0.5s";
							li.style.opacity = "0";
							setTimeout(() => {
								removeAlarm(index);
								li.remove();
							}, 500);
						});
					}
				}

				li.addEventListener("dragstart", (e) => {
					e.dataTransfer.setData("text/plain", null);
					li.style.opacity = "0.5";
				});

				li.addEventListener("drag", (e) => {
					li.style.left = `${e.pageX}px`;
					li.style.top = `${e.pageY}px`;
				});

				li.addEventListener("dragend", () => {
					li.style.opacity = "1";
					li.style.transform = "scale(1)";
					li.style.backgroundColor = "";
					li.removeAttribute("draggable");
					li.style.left = "";
					li.style.top = "";
				});
			}, 500); // Adjust the timeout duration as needed
		};

		const endHold = (event) => {
			clearTimeout(holdTimeout);
			li.style.transform = "scale(1)";
			event.stopPropagation(); // Prevent the click event from bubbling up
		};

		// Add event listener to detect clicks outside the remove-alarm-btn
		var clicks = 0;
		document.addEventListener("click", (event) => {
			const removeAlarmButton = document.querySelector(
				".footer .remove-alarm-btn"
			);

			if (
				removeAlarmButton &&
				!removeAlarmButton.contains(event.target) & (clicks >= 1)
			) {
				revertChanges();
				clicks = 0;
			} else {
				if (clicks >= 1) {
					clicks = 0;
				}
				clicks++;
			}
		});

		li.addEventListener("mousedown", startHold);
		li.addEventListener("mouseup", endHold);
		li.addEventListener("mouseleave", endHold);

		li.addEventListener("touchstart", startHold);
		li.addEventListener("touchend", endHold);
		li.addEventListener("touchcancel", endHold);
	});
}

function toggleAlarm(index) {
	// Toggle the active state of the alarm
	alarms[index].active = !alarms[index].active;
	alarms[index].lastRanDay = null;

	// Save the updated alarms to persist the state
	saveAlarms();
}

function saveAlarms() {
    fetch("/save-alarms", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(alarms),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            console.log("Alarms saved successfully:", data);
			console.log(alarms);
            renderAlarms();
        })
        .catch((error) => console.error("Error saving alarms:", error));
}

function removeAlarm(index) {
	console.log("Removing alarm at index:", index);
	alarms.splice(index, 1);
	saveAlarms();
	renderAlarms();
}

function editAlarm(index) {
	const alarm = alarms[index];
	document.getElementById("new-alarm-time").value = alarm.time;
	document.getElementById("new-alarm-label").value = alarm.label;
	document.getElementById("new-alarm-duration").value = alarm.duration;
	document.getElementById("new-alarm-repeat").value = alarm.repeat;
	document.getElementById("new-alarm-delay").value = alarm.delay;
	document
		.querySelectorAll('#new-weekday-selector input[type="checkbox"]')
		.forEach((checkbox, i) => {
			checkbox.checked = alarm.weekdays.includes(i);
		});

	// Store the index of the alarm being edited
	modalContent.dataset.editIndex = index;

	// Show the modal
	openModal(true);
}

const saveNewAlarmBtn = document.getElementById("save-new-alarm-btn");
saveNewAlarmBtn.addEventListener("click", () => {
	const time = document.getElementById("new-alarm-time").value;
	const label = document.getElementById("new-alarm-label").value;
	const duration = parseInt(
		document.getElementById("new-alarm-duration").value,
		10
	);
	const repeat = parseInt(
		document.getElementById("new-alarm-repeat").value,
		10
	);
	const delay = parseInt(
		document.getElementById("new-alarm-delay").value,10
	);
	const weekdays = Array.from(
		document.querySelectorAll('#new-weekday-selector input[type="checkbox"]')
	)
		.filter((checkbox) => checkbox.checked)
		.map((checkbox) => parseInt(checkbox.value, 10));

	// Validation
	if (!time) {
		alert("Please set a valid time for the alarm.");
		return;
	}
	if (isNaN(duration) || duration <= 0) {
		alert("Please enter a valid duration greater than 0.");
		return;
	}
	if (weekdays.length === 0) {
		alert("Please select at least one day for the alarm.");
		return;
	}

	// New alarm object
	const alarm = {
		time,
		label: label || "Alarm",
		duration,
		weekdays,
		active: true,
		lastRanDay: null,
		triggered: false,
		repeat,
		delay
	};

	// Check if editing an existing alarm
	const editIndex = modalContent.dataset.editIndex;
	if (editIndex !== undefined) {
		alarms.splice(parseInt(editIndex), 1);
		delete modalContent.dataset.editIndex;
	}

	alarms.push(alarm);
	saveAlarms(); // Save the updated alarm list
	renderAlarms();
	closeModal();
});

const saveNewTimeBtn = document.getElementById("save-new-time-btn");

saveNewTimeBtn.addEventListener("click", () => {
    const datetime = document.getElementById("time-input").value;
    
    if (!datetime) {
        alert("Please set a valid date and time.");
        return;
    }

    fetch("/set-datetime", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ datetime: datetime })
    })
    .then(response => response.json())
    .then(data => {
        console.log("DateTime set:", data);
        closeModal();
		syncDateTime();
        serverTime(); // Update the clock display
    })
    .catch(error => {
        console.error("Error setting datetime:", error);
        alert("Failed to set date and time");
    });
});