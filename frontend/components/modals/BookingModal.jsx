// components/BookingModal.js
import React from 'react';

export default function BookingModal({
  show,
  slot,
  date,
  employeeName,
  meetingTitle,
  setEmployeeName,
  setMeetingTitle,
  onClose,
  onBook,
  loading,
}) {
  if (!show || !slot) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Book Slot</h2>
        <p className="mb-2 text-sm text-gray-600">
          <strong>Time:</strong> {slot[0]} - {slot[1]}<br />
          <strong>Date:</strong> {date}
        </p>
        <input
          type="text"
          placeholder="Employee Name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
        />
        <input
          type="text"
          placeholder="Meeting Title"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onBook}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Booking...' : 'Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
