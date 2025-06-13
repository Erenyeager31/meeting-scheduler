export default function BookingModal({
  show,
  date,
  employeeName,
  meetingTitle,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  setEmployeeName,
  setMeetingTitle,
  onClose,
  onBook,
  loading,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Book Slot</h2>
        <p className="mb-2 text-sm text-gray-600">
          <strong>Date:</strong> {date}
        </p>
        <div className="flex space-x-2 mb-3">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-1/2 border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-1/2 border border-gray-300 rounded px-3 py-2"
          />
        </div>
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
