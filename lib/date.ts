export function getUtcDayBounds(dateText?: string | null) {
  const baseDate = dateText ? new Date(dateText) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid date format");
  }

  const start = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);

  return {
    start,
    end,
    dateLabel: start.toISOString().slice(0, 10),
  };
}
