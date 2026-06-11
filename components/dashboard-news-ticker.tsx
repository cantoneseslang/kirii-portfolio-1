type DashboardNewsTickerProps = {
  text: string
}

export function DashboardNewsTicker({ text }: DashboardNewsTickerProps) {
  return (
    <div className="news-ticker mb-4 border-y border-gray-200 py-2">
      <div className="news-ticker-viewport">
        <p className="news-ticker-run text-sm font-medium text-blue-600 md:text-base">{text}</p>
      </div>
    </div>
  )
}
