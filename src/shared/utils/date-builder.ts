export const formatDate = (date: Date = new Date()) => {
  const formattedDate = date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const time = date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const newDate = {
    date,
    format: formattedDate,
    time,
    fullDate: `${formattedDate} at ${time}`,
    timestamps: date.getTime(),
  };

  return newDate;
};
