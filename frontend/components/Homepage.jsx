import React, { useState } from "react";
import BookingModal from "./modals/BookingModal";
import RescheduleModal from "./modals/RescheduleModal";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  // obtain the user details stored in the localstorage
  const user = JSON.parse(localStorage.getItem("user"));

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // modal control
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [employeeName, setEmployeeName] = useState(user.name);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookedSlots, setBookedSlots] = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState(["", ""]);

  const navigate = useNavigate();

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleBooking = async () => {
  if (!employeeName || !meetingTitle || !startTime || !endTime) {
    setDebugInfo("Please fill out all fields including time");
    return;
  }

  const payload = {
    employeeId: user.id,
    employeeName: user.name,
    date: date, // from parent scope
    startTime,
    endTime,
    title: meetingTitle,
  };

  setBookingLoading(true);
  setDebugInfo("Booking slot...");

  try {
    const response = await fetch("http://localhost:3000/meeting/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Booking failed.");
    }

    setDebugInfo(`Booked successfully: ${result.message || "OK"}`);
    setShowModal(false);
    setEmployeeName("");
    setMeetingTitle("");
    setStartTime("");
    setEndTime("");
  } catch (error) {
    console.error("Booking Error:", error);
    setDebugInfo(`Booking failed: ${error.message}`);
  } finally {
    setBookingLoading(false);
  }
};


  const fetchBookedSlots = async () => {
    if (!date) {
      setDebugInfo("Please select a date first");
      return;
    }

    setDebugInfo("Fetching booked slots...");
    try {
      const response = await fetch(
        `http://localhost:3000/meeting/getBookedSlots?date=${date}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setBookedSlots(data.bookedSlots || []); // now array of objects
      setDebugInfo(`Booked slots loaded: ${data.bookedSlots.length}`);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  const handleReschedule = async () => {
    if (!selectedBooking?.id || !newDate || !newSlot[0] || !newSlot[1]) {
      setDebugInfo("Please complete all fields for rescheduling");
      return;
    }

    setDebugInfo("Rescheduling...");
    try {
      const response = await fetch(
        `http://localhost:3000/meeting/reschedule/${selectedBooking.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: newDate,
            newStartTime: newSlot[0],
            newEndTime: newSlot[1],
          }),
        }
      );

      const data = await response.json();
      setDebugInfo(`Rescheduled: ${data.message || "OK"}`);
      setRescheduleModal(false);
      fetchBookedSlots(); // Refresh list
    } catch (error) {
      console.error("Reschedule error:", error);
      setDebugInfo(`Reschedule failed: ${error.message}`);
    }
  };

  const fetchSlots = async () => {
    if (!date) {
      setDebugInfo("Please select a date first");
      return;
    }

    setLoading(true);
    setDebugInfo("Fetching slots...");

    try {
      const response = await fetch(
        `http://localhost:3000/meeting/getAll?date=${date}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      // Debug logging
      console.log("API Response:", data);
      console.log("Available Slots:", data.availableSlots);

      setSlots(data.availableSlots || []);
      setDebugInfo(
        `Response received. Slots found: ${(data.availableSlots || []).length}`
      );
    } catch (error) {
      console.error("Error fetching slots:", error);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // handle logout
  const logout = async () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 flex-1">
          📅 Schedule a Meeting
        </h1>

        {user && (
          <div className="flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
            {/* User avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-700">{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>

            <div className="text-right">
              <button
                onClick={logout}
                className="font-semibold text-gray-700 hover:text-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchSlots}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 transition duration-200 font-semibold shadow-md"
        >
          {loading ? "Loading..." : "Load Slots"}
        </button>
        <button
          onClick={fetchBookedSlots}
          className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-2 rounded-md hover:from-rose-700 hover:to-pink-700 transition duration-200 font-semibold shadow-md"
        >
          Load Booked Slots
        </button>
      </div>

      {/* Debug information */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 text-sm">
          <strong>Debug:</strong> {debugInfo}
        </div>
      )}

      {/* Display current state */}
      <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm">
        <p>
          <strong>Selected Date:</strong> {date || "None"}
        </p>
        <p>
          <strong>Slots Array Length:</strong> {slots.length}
        </p>
        <p>
          <strong>Loading:</strong> {loading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Raw Slots Data:</strong> {JSON.stringify(slots)}
        </p>
      </div>

      {slots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="aspect-square bg-green-100 border border-green-300 text-green-800 font-medium flex items-center justify-center rounded shadow-sm text-sm hover:bg-green-200 transition cursor-pointer"
              onClick={() => handleSlotClick(slot)}
            >
              {Array.isArray(slot) ? `${slot[0]} - ${slot[1]}` : slot}
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <p className="text-center text-gray-500 mt-6">
            {date
              ? "No available slots for this date."
              : "Please select a date to see available slots."}
          </p>
        )
      )}

      {bookedSlots.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-4 text-red-700">
            Booked Slots
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bookedSlots.map((slot) => (
              <div
                key={slot.meetingId}
                className="aspect-square bg-red-100 border border-red-300 text-red-800 font-medium flex items-center justify-center rounded shadow-sm text-sm hover:bg-red-200 transition cursor-pointer"
                onClick={() => {
                  if (slot.employeeId !== user.id) {
                    alert("You can only reschedule your own meeting !");
                    return;
                  }
                  setSelectedBooking({
                    employeeID: slot.employeeId,
                    id: slot.meetingId,
                    start: slot.startTime,
                    end: slot.endTime,
                  });
                  setNewSlot([slot.startTime, slot.endTime]);
                  setNewDate(date);
                  setRescheduleModal(true);
                }}
              >
                {`${slot.startTime} - ${slot.endTime}`}
              </div>
            ))}
          </div>
        </>
      )}

      <BookingModal
        show={showModal}
        date={date}
        employeeName={employeeName}
        meetingTitle={meetingTitle}
        startTime={startTime}
        endTime={endTime}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
        setEmployeeName={setEmployeeName}
        setMeetingTitle={setMeetingTitle}
        onClose={() => setShowModal(false)}
        onBook={handleBooking}
        loading={bookingLoading}
      />

      <RescheduleModal
        selectedBooking={selectedBooking}
        newDate={newDate}
        newSlot={newSlot}
        setNewDate={setNewDate}
        setNewSlot={setNewSlot}
        onClose={() => {
          setRescheduleModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={handleReschedule}
        onCancelSuccess={() => {
          setRescheduleModal(false);
          setSelectedBooking(null);
          fetchBookedSlots(); // Refresh slot data
        }}
      />
    </div>
  );
}
