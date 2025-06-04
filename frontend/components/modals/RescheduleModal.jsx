import React, { useState } from "react";

export default function RescheduleModal({
  selectedBooking,
  newDate,
  newSlot,
  setNewDate,
  setNewSlot,
  onClose,
  onConfirm,
  onCancelSuccess, // callback to refresh data or close modal
}) {
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  if (!selectedBooking) return null;

  function isValidSlotTime(timeStr) {
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (hours < 9 || hours > 18) return false;
    if (hours === 18 && minutes !== 0) return false;
    if (minutes !== 0 && minutes !== 30) return false;

    return true;
  }

  const handleConfirm = () => {
    if (!isValidSlotTime(newSlot[0]) || !isValidSlotTime(newSlot[1])) {
      alert("Please select time between 09:00 and 18:00, with minutes 00 or 30 only.");
      return;
    }
    if (newSlot[1] <= newSlot[0]) {
      alert("End time must be after start time.");
      return;
    }
    onConfirm();
  };

  const handleCancelMeeting = async () => {
    if (!selectedBooking?.id) return;

    setCancelLoading(true);
    setCancelError("");

    try {
      const res = await fetch(`http://localhost:3000/meeting/cancel/${selectedBooking.id}`, {
        method: "delete",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to cancel meeting");

      // Close modal and notify parent
      if (onCancelSuccess) onCancelSuccess();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Reschedule or Cancel Meeting</h2>

        <p className="text-sm text-gray-700 mb-2">
          <strong>Original:</strong> {selectedBooking.start} - {selectedBooking.end}
        </p>

        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
        />

        <div className="flex gap-2 mb-3">
          <input
            type="time"
            value={newSlot[0]}
            onChange={(e) => setNewSlot([e.target.value, newSlot[1]])}
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="time"
            value={newSlot[1]}
            onChange={(e) => setNewSlot([newSlot[0], e.target.value])}
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {cancelError && <p className="text-red-500 text-sm mb-2">{cancelError}</p>}

        <div className="flex justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancelMeeting}
              disabled={cancelLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {cancelLoading ? "Cancelling..." : "Cancel Meeting"}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
