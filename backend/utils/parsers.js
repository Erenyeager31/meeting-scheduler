export function parseDate(dateString) {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
}

// Helper function to parse date and time together
export function parseDateTime(dateString, timeString) {
  // Combine date and time, then parse as UTC to avoid timezone issues
  const dateTimeString = `${dateString}T${timeString}:00.000`;
  return new Date(dateTimeString);
}

export const formatTime = (dateObj) => {
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function parseLocalDateTime(dateString, timeString) {
  // Combine date and time as local time (no 'Z')
  const dateTimeString = `${dateString}T${timeString}:00.000`;
  return new Date(dateTimeString);
}