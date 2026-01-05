const daysOfWeek: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

const months: Record<number, string> = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December"
};

// Add a 0 to the start if the number is under 10
const pad = (num: number): string => (num < 10 ? '0' + num : num.toString());

// Date formatting for displaying start and end dates
export const formatDate = (startTime: string, endTime: string): string => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getHours() === endDate.getHours() &&
      startDate.getMinutes() === endDate.getMinutes()) {
      return `${daysOfWeek[startDate.getDay()]} ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} at ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    } else {
      return `${daysOfWeek[startDate.getDay()]} ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} from ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} to ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
    }
  } else {
    return `${daysOfWeek[startDate.getDay()]} ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${daysOfWeek[endDate.getDay()]} ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()} ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  }
};

// Date formatting for displaying sign up deadline
export const formatSingleDate = (date: string): string => {
  const d = new Date(date);

  const dayName = daysOfWeek[d.getDay()];
  const day = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${dayName} ${day} ${monthName} ${year} - ${hours}:${minutes}`;
};

export const getDateRange = (type: string): { start: Date; end: Date } | null => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (type) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };

    case "thisWeek": {
      const day = now.getDay(); // 0 = Sun
      const diff = day === 0 ? -6 : 1 - day; // Monday as start
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);

      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "nextWeek": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      start.setDate(now.getDate() + diff + 7);
      start.setHours(0, 0, 0, 0);

      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setMonth(start.getMonth() + 1);
      end.setDate(0); // last day of current month
      end.setHours(23, 59, 59, 999);

      return { start, end };

    default:
      return null;
  }
};
