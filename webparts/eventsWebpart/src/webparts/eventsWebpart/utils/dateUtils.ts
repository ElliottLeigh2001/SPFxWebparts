export const formatDate = (startTime: string, endTime: string): string => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const pad = (num: number): string => (num < 10 ? '0' + num : num.toString());

  if (startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()) {
    return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} from ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} to ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  } else {
    return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()} ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  }
};

export const formatSingleDate = (date: string): string => {
  const startDate = new Date(date);
  const pad = (num: number): string => (num < 10 ? '0' + num : num.toString());

  return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()}`;

};