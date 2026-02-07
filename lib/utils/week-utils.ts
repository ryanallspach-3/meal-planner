// Week utilities - Saturday is the first day of the week

// Days of the week starting with Saturday
export const DAYS_OF_WEEK = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
]

// Convert our day index (0=Saturday) to JS Date day (0=Sunday)
export function toJsDay(dayIndex: number): number {
  // dayIndex: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  // JS day:   6=Sat, 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  return dayIndex === 0 ? 6 : dayIndex - 1
}

// Convert JS Date day (0=Sunday) to our day index (0=Saturday)
export function fromJsDay(jsDay: number): number {
  // JS day:   0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // dayIndex: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 0=Sat
  return jsDay === 6 ? 0 : jsDay + 1
}

// Get the Saturday that starts the week containing the given date
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const jsDay = d.getDay() // 0=Sun, 6=Sat
  // Days since last Saturday
  const daysSinceSat = jsDay === 6 ? 0 : jsDay + 1
  d.setDate(d.getDate() - daysSinceSat)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get the Friday that ends the week containing the given date
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

// Get week number (Saturday-based weeks)
// Week 1 is the week containing January 1
export function getWeekNumber(date: Date): number {
  const weekStart = getWeekStart(date)
  const yearStart = new Date(weekStart.getFullYear(), 0, 1)
  const yearStartWeek = getWeekStart(yearStart)

  const diffMs = weekStart.getTime() - yearStartWeek.getTime()
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))

  return diffWeeks + 1
}

// Get the year for a given week (handles year boundaries)
export function getWeekYear(date: Date): number {
  const weekStart = getWeekStart(date)
  return weekStart.getFullYear()
}

// Get the start date for a given week number and year
export function getDateFromWeek(weekNumber: number, year: number): Date {
  // Start with January 1 of the year
  const jan1 = new Date(year, 0, 1)
  const jan1WeekStart = getWeekStart(jan1)

  // Add the number of weeks
  const targetDate = new Date(jan1WeekStart)
  targetDate.setDate(targetDate.getDate() + (weekNumber - 1) * 7)

  return targetDate
}

// Format date as "Mon D" (e.g., "Jan 4")
export function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

// Format date range for a week
export function formatWeekRange(weekNumber: number, year: number): string {
  const start = getDateFromWeek(weekNumber, year)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  if (start.getMonth() === end.getMonth()) {
    // Same month: "Jan 4-10"
    return `${formatShortDate(start)}-${end.getDate()}`
  } else {
    // Different months: "Jan 28 - Feb 3"
    return `${formatShortDate(start)} - ${formatShortDate(end)}`
  }
}

// Get date for a specific day in a week
export function getDateForDay(weekNumber: number, year: number, dayIndex: number): Date {
  const weekStart = getDateFromWeek(weekNumber, year)
  const date = new Date(weekStart)
  date.setDate(date.getDate() + dayIndex)
  return date
}

// Format a day with its date (e.g., "Saturday, Jan 4")
export function formatDayWithDate(weekNumber: number, year: number, dayIndex: number): string {
  const date = getDateForDay(weekNumber, year, dayIndex)
  return `${DAYS_OF_WEEK[dayIndex]}, ${formatShortDate(date)}`
}
