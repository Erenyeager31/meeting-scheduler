import Meeting from "../models/meeting.js";
import {
  parseDate,
  parseDateTime,
  formatTime,
  parseLocalDateTime,
} from "../utils/parsers.js";

export const getBookedSlots = async (req, res) => {
  try {
    const User = req.user;

    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Please provide a valid date in YYYY-MM-DD format" });
    }

    const meetingDate = parseDate(date);

    // Define business hours in local time
    const startLimit = parseDateTime(date, "09:00");
    const endLimit = parseDateTime(date, "18:00");

    // Find all scheduled meetings for the given date
    const meetings = await Meeting.find({
      date: meetingDate,
      status: "scheduled",
    }).sort({ startTime: 1 });

    const bookedSlots = meetings
      .filter((meeting) => {
        const start = new Date(meeting.startTime);
        const end = new Date(meeting.endTime);
        // Only include meetings entirely within 09:00–18:00
        return start >= startLimit && end <= endLimit;
      })
      .map((meeting) => {
        const startDate = new Date(meeting.startTime);
        const endDate = new Date(meeting.endTime);

        const startStr = `${startDate
          .getHours()
          .toString()
          .padStart(2, "0")}:${startDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        const endStr = `${endDate
          .getHours()
          .toString()
          .padStart(2, "0")}:${endDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        return {
          startTime: startStr,
          endTime: endStr,
          meetingId: meeting._id,
          employeeId:meeting.employee,
          employee:meeting.employeeName,
          title: meeting.title || "Meeting",
          duration: Math.round(
            (meeting.endTime - meeting.startTime) / (1000 * 60)
          ), // in minutes
        };
      });

    const simpleSlots = bookedSlots.map((slot) => [
      slot.startTime,
      slot.endTime,
    ]);

    res.status(200).json({
      date,
      bookedSlots, // detailed info
      bookedSlotsSimple: simpleSlots, // simple slot array format
      totalBookedSlots: bookedSlots.length,
    });
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching booked slots" });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Please provide a valid date in YYYY-MM-DD format" });
    }

    // const now = new Date();
    // const nowUTC = new Date(); // current UTC time
    // const now = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000); // add 5.5 hours
    const now = new Date(); // local time directly
    const meetingDate = parseDate(date);

    // console.log(nowUTC,now);

    // Check if the requested date is in the past (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    if (meetingDate < today) {
      return res.status(400).json({
        message: "Cannot retrieve slots for past dates",
        date,
        availableSlots: [],
        totalSlots: 0,
      });
    }

    const rawSlots = [
      ["09:00", "09:30"],
      ["09:30", "10:00"],
      ["10:00", "10:30"],
      ["10:30", "11:00"],
      ["11:00", "11:30"],
      ["11:30", "12:00"],
      ["12:00", "12:30"],
      ["12:30", "13:00"],
      ["13:00", "13:30"],
      ["13:30", "14:00"],
      ["14:00", "14:30"],
      ["14:30", "15:00"],
      ["15:00", "15:30"],
      ["15:30", "16:00"],
      ["16:00", "16:30"],
      ["16:30", "17:00"],
      ["17:00", "17:30"],
      ["17:30", "18:00"],
    ];

    const allSlots = rawSlots.map(([startStr, endStr]) => {
      const startDateTime = parseDateTime(date, startStr);
      const endDateTime = parseDateTime(date, endStr);
      return { start: startDateTime, end: endDateTime, startStr, endStr };
    });

    const meetings = await Meeting.find({
      date: meetingDate,
      status: "scheduled",
    });

    // Add logging to debug:
    console.log(
      "Found meetings:",
      meetings.map((m) => ({
        start: m.startTime,
        end: m.endTime,
        startType: typeof m.startTime,
        endType: typeof m.endTime,
      }))
    );

    const availableSlots = allSlots.filter((slot) => {
      // Instead of slot.start <= now, check if slot.end is already past
      if (slot.start <= now) {
        return false;
      }

      // Check if slot conflicts with any meeting
      const hasConflict = meetings.some((meeting) => {
        return slot.start < meeting.endTime && slot.end > meeting.startTime;
      });

      return !hasConflict;
    });

    const formattedSlots = availableSlots.map((slot) => [
      slot.startStr,
      slot.endStr,
    ]);

    res.status(200).json({
      date,
      availableSlots: formattedSlots,
      totalSlots: formattedSlots.length,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching available slots" });
  }
};

export const bookMeeting = async (req, res) => {
  try {
    const { employeeId, employeeName, date, startTime, endTime, title } =
      req.body;

    // Validate required fields
    if (!employeeId || !employeeName || !date || !startTime || !endTime) {
      return res.status(400).json({
        message:
          "employeeId, employeeName, date, startTime, and endTime are required",
      });
    }

    // // Optionally validate employeeId exists in DB
    // const employeeExists = await User.findById(employeeId);
    // if (!employeeExists) {
    //   return res.status(400).json({ message: "Invalid employeeId" });
    // }

    const startTimeSplit = startTime.split(":");
    const endTimeSplit = endTime.split(":");

    const start = new Date(date);
    start.setHours(Number(startTimeSplit[0]), Number(startTimeSplit[1]), 0, 0);

    const end = new Date(date);
    end.setHours(Number(endTimeSplit[0]), Number(endTimeSplit[1]), 0, 0);

    const durationMinutes = (end - start) / (1000 * 60);

    if (durationMinutes > 30) {
      return res.status(400).json({
        message: "Maximum meeting time is only 30 minutes",
      });
    }

    if (Number(startTimeSplit[0]) === 18 || Number(startTimeSplit[0]) < 9) {
      return res.status(400).json({
        message: "Time slots are available only between 9-18",
      });
    }

    // Parse date and time correctly
    const meetingDate = parseDate(date);
    const startDateTime = parseDateTime(date, startTime);
    const endDateTime = parseDateTime(date, endTime);

    // Basic validation
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        message: "startTime must be before endTime",
      });
    }

    // Check for conflicts
    const conflict = await Meeting.findOne({
      date: meetingDate,
      status: "scheduled",
      $or: [
        { startTime: { $lt: endDateTime }, endTime: { $gt: startDateTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        message: "Conflict: Meeting already scheduled during this slot",
      });
    }

    // Create and save new meeting
    const newMeeting = new Meeting({
      employee: employeeId, // store ObjectId
      employeeName, // keep the name field too
      date: meetingDate,
      startTime: startDateTime,
      endTime: endDateTime,
      title: title || `Meeting with ${employeeName}`,
      status: "scheduled",
    });

    await newMeeting.save();

    res.status(201).json({
      message: "Meeting booked successfully",
      meeting: newMeeting,
    });
  } catch (error) {
    console.error("Meeting booking error:", error);
    res.status(500).json({
      message: "Server error while booking meeting",
    });
  }
};

export const rescheduleMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, newStartTime, newEndTime } = req.body;

    if (!date || !newStartTime || !newEndTime) {
      return res.status(400).json({
        message: "date, newStartTime, and newEndTime are required",
      });
    }

    const startTimeSplit = newStartTime.split(":");
    const endTimeSplit = newEndTime.split(":");

    const start = new Date(date);
    start.setHours(Number(startTimeSplit[0]), Number(startTimeSplit[1]), 0, 0);

    const end = new Date(date);
    end.setHours(Number(endTimeSplit[0]), Number(endTimeSplit[1]), 0, 0);

    const durationMinutes = (end - start) / (1000 * 60);

    if (durationMinutes > 30) {
      return res.status(400).json({
        message: "Maximum meeting time is only 30 minutes",
      });
    }

    if (Number(newStartTime.split(":")[0]) == 18) {
      return res.status(400).json({
        message: "Time slots are available only between 9-18",
      });
    }

    if (Number(newEndTime.split(":")[0]) < 9) {
      return res.status(400).json({
        message: "Time slots are available only between 9-18",
      });
    }

    const newMeetingDate = parseDate(date);
    const newStartDateTime = parseDateTime(date, newStartTime);
    const newEndDateTime = parseDateTime(date, newEndTime);

    // Basic validation
    if (newStartDateTime >= newEndDateTime) {
      return res.status(400).json({
        message: "Start time must be before end time",
      });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (meeting.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot reschedule a cancelled meeting",
      });
    }

    const conflict = await Meeting.findOne({
      _id: { $ne: id },
      // employeeName: meeting.employeeName, // Check conflicts for same employee
      date: newMeetingDate,
      status: "scheduled",
      $or: [
        {
          startTime: { $lt: newEndDateTime },
          endTime: { $gt: newStartDateTime },
        },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        message: "Time conflict with another scheduled meeting",
        conflictingMeeting: {
          id: conflict._id,
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      });
    }

    meeting.date = newMeetingDate;
    meeting.startTime = newStartDateTime;
    meeting.endTime = newEndDateTime;
    meeting.updatedAt = new Date();

    await meeting.save();

    return res.status(200).json({
      message: "Meeting successfully rescheduled",
      meeting,
    });
  } catch (error) {
    console.error("Error in rescheduleMeeting:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (meeting.status === "cancelled") {
      return res.status(400).json({
        message: "Meeting is already cancelled",
      });
    }

    const nowUTC = new Date(); // current UTC time
    const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000); // add 5.5 hours

    const meetingStart = new Date(meeting.startTime); // already saved in IST

    if (nowIST >= meetingStart) {
      return res.status(400).json({
        message: "Cannot cancel a meeting that has already started or passed",
      });
    }

    meeting.status = "cancelled";
    meeting.updatedAt = new Date();
    await meeting.save();

    return res.status(200).json({
      message: "Meeting successfully cancelled",
      meeting,
    });
  } catch (error) {
    console.error("Error in cancelMeeting:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
