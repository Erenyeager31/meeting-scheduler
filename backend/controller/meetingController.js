import Meeting from "../models/meeting.js";
import moment from "moment-timezone";

export const getBookedSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Please provide a valid date in YYYY-MM-DD format",
      });
    }

    // Parse the start and end of the given date in IST
    const businessStartIST = moment.tz(
      `${date} 09:00`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );
    const businessEndIST = moment.tz(
      `${date} 18:00`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );

    // Convert business hours boundaries to UTC for querying DB
    const businessStartUTC = businessStartIST.clone().utc().toDate();
    const businessEndUTC = businessEndIST.clone().utc().toDate();

    const meetings = await Meeting.find({
      status: "scheduled",
      startTime: { $gte: businessStartUTC, $lt: businessEndUTC },
      endTime: { $gt: businessStartUTC, $lte: businessEndUTC },
    }).sort({ startTime: 1 });

    const bookedSlots = meetings.map((meeting) => {
      const startIST = moment.utc(meeting.startTime).tz("Asia/Kolkata");
      const endIST = moment.utc(meeting.endTime).tz("Asia/Kolkata");

      return {
        startTime: startIST.format("HH:mm"),
        endTime: endIST.format("HH:mm"),
        meetingId: meeting._id,
        employeeId: meeting.employee,
        employee: meeting.employeeName,
        title: meeting.title || "Meeting",
        duration: Math.round(endIST.diff(startIST, "minutes")),
      };
    });

    const simpleSlots = bookedSlots.map((slot) => [
      slot.startTime,
      slot.endTime,
    ]);

    res.status(200).json({
      date,
      bookedSlots,
      bookedSlotsSimple: simpleSlots,
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
      return res.status(400).json({
        message: "Please provide a valid date in YYYY-MM-DD format",
      });
    }

    const nowIST = moment.tz("Asia/Kolkata");
    const dateStartIST = moment.tz(`${date} 09:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const dateEndIST = moment.tz(`${date} 18:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    // Prevent fetching past dates
    const todayIST = nowIST.clone().startOf("day");
    if (dateStartIST.isBefore(todayIST)) {
      return res.status(400).json({
        message: "Cannot retrieve slots for past dates",
        date,
        availableSlots: [],
        totalSlots: 0,
      });
    }

    const startUTC = dateStartIST.clone().utc().toDate();
    const endUTC = dateEndIST.clone().utc().toDate();

    const meetings = await Meeting.find({
      status: "scheduled",
      startTime: { $lt: endUTC },
      endTime: { $gt: startUTC },
    }).sort({ startTime: 1 });

    const availableSlots = [];
    let slotStart = dateStartIST.clone();

    for (const meeting of meetings) {
      const meetingStart = moment.utc(meeting.startTime).tz("Asia/Kolkata");
      const meetingEnd = moment.utc(meeting.endTime).tz("Asia/Kolkata");

      // If the gap between slotStart and meetingStart is > 0
      if (meetingStart.isAfter(slotStart)) {
        const gapEnd = meetingStart.clone();

        // Avoid adding past slots
        if (gapEnd.isAfter(nowIST)) {
          const availableStart = moment.max(slotStart, nowIST);
          if (gapEnd.isAfter(availableStart)) {
            availableSlots.push([
              availableStart.format("HH:mm"),
              gapEnd.format("HH:mm"),
            ]);
          }
        }
      }

      // Move slotStart forward to the max of current slotStart and meetingEnd
      if (meetingEnd.isAfter(slotStart)) {
        slotStart = meetingEnd.clone();
      }
    }

    // Check if time remains between last slot and businessEnd
    if (slotStart.isBefore(dateEndIST) && dateEndIST.isAfter(nowIST)) {
      const availableStart = moment.max(slotStart, nowIST);
      if (dateEndIST.isAfter(availableStart)) {
        availableSlots.push([
          availableStart.format("HH:mm"),
          dateEndIST.format("HH:mm"),
        ]);
      }
    }

    return res.status(200).json({
      date,
      availableSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      message: "Server error while fetching available slots",
    });
  }
};

export const bookMeeting = async (req, res) => {
  try {
    const { employeeId, employeeName, date, startTime, endTime, title } =
      req.body;

    if (!employeeId || !employeeName || !date || !startTime || !endTime) {
      return res.status(400).json({
        message:
          "employeeId, employeeName, date, startTime, and endTime are required",
      });
    }

    // Parse date and times in IST timezone
    const startIST = moment.tz(
      `${date} ${startTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );
    const endIST = moment.tz(
      `${date} ${endTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );

    // Check if start time is between 9:00 and 18:00 IST
    const businessStart = moment.tz(`${date} 09:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const businessEnd = moment.tz(`${date} 18:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    if (
      startIST.isBefore(businessStart) ||
      endIST.isAfter(businessEnd) ||
      !startIST.isBefore(endIST)
    ) {
      return res.status(400).json({
        message: "Meetings must be fully within 09:00 to 18:00 IST and end after start time.",
      });
    }

    if (!startIST.isBefore(endIST)) {
      return res.status(400).json({
        message: "startTime must be before endTime",
      });
    }

    // Check if start time is in the past (relative to now in IST)
    const nowIST = moment.tz("Asia/Kolkata");
    if (startIST.isBefore(nowIST)) {
      return res.status(400).json({
        message: "Cannot book a meeting in the past",
      });
    }

    // Convert times to UTC for storing in DB
    const startUTC = startIST.clone().utc().toDate();
    const endUTC = endIST.clone().utc().toDate();

    // Check for conflicts without a separate date field
    const conflict = await Meeting.findOne({
      status: "scheduled",
      $or: [{ startTime: { $lt: endUTC }, endTime: { $gt: startUTC } }],
    });

    if (conflict) {
      return res.status(409).json({
        message: "Conflict: Meeting already scheduled during this slot",
      });
    }

    // Create and save new meeting without separate date field
    const newMeeting = new Meeting({
      employee: employeeId,
      employeeName,
      startTime: startUTC,
      endTime: endUTC,
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

    // Parse start and end in IST
    const startIST = moment.tz(`${date} ${newStartTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const endIST = moment.tz(`${date} ${newEndTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    if (!startIST.isValid() || !endIST.isValid()) {
      return res.status(400).json({
        message: "Invalid time or date format",
      });
    }

    // Check if start time is between 9:00 and 18:00 IST
    const businessStart = moment.tz(`${date} 09:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const businessEnd = moment.tz(`${date} 18:00`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    if (
      startIST.isBefore(businessStart) ||
      endIST.isAfter(businessEnd) ||
      !startIST.isBefore(endIST)
    ) {
      return res.status(400).json({
        message: "Meetings must be fully within 09:00 to 18:00 IST and end after start time.",
      });
    }

    if (!startIST.isBefore(endIST)) {
      return res.status(400).json({
        message: "Start time must be before end time",
      });
    }

    // Convert IST to UTC for DB comparison
    const startUTC = startIST.clone().utc().toDate();
    const endUTC = endIST.clone().utc().toDate();

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
      status: "scheduled",
      $or: [
        {
          startTime: { $lt: endUTC },
          endTime: { $gt: startUTC },
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

    // Update meeting
    meeting.startTime = startUTC;
    meeting.endTime = endUTC;
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

    // Current time in IST
    const nowIST = moment.tz("Asia/Kolkata");

    // Meeting start time is stored in UTC in DB
    const meetingStartIST = moment.tz(meeting.startTime, "Asia/Kolkata");

    if (nowIST.isSameOrAfter(meetingStartIST)) {
      return res.status(400).json({
        message: "Cannot cancel a meeting that has already started or passed",
      });
    }

    meeting.status = "cancelled";
    meeting.updatedAt = new Date(); // or use moment.utc().toDate()
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
