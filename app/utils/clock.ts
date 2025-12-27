export class Clock {
  private readonly dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }

  private readonly timeOptions: Intl.DateTimeFormatOptions = {
    minute: '2-digit',
    hour: '2-digit',
  }

  private readonly lockScreenDateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', this.timeOptions)
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', this.dateOptions)
  }

  getLockScreenDate(): string {
    return new Date().toLocaleDateString('en-US', this.lockScreenDateOptions)
  }
}
