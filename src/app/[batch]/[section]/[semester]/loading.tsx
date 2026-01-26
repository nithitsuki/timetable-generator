export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded bg-muted animate-pulse" />
              <div className="hidden sm:block space-y-2">
                <div className="w-32 h-5 rounded bg-muted animate-pulse" />
                <div className="w-24 h-4 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-9 rounded bg-muted animate-pulse" />
              <div className="w-24 h-9 rounded bg-muted animate-pulse" />
              <div className="w-20 h-9 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Skeleton Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Skeleton toolbar */}
          <div className="mb-4 flex items-center justify-end gap-4">
            <div className="w-32 h-9 rounded bg-muted animate-pulse" />
          </div>

          {/* Skeleton timetable */}
          <div className="rounded-lg border border-border shadow-md bg-background overflow-hidden">
            {/* Header row */}
            <div className="flex border-b border-border">
              <div className="w-20 h-12 bg-muted" />
              <div className="flex-1 h-12 bg-muted/50" />
            </div>
            
            {/* Day rows */}
            {[1, 2, 3, 4, 5].map((day) => (
              <div key={day} className="flex border-b border-border last:border-b-0">
                <div className="w-20 h-16 bg-muted/30 animate-pulse" />
                <div className="flex-1 h-16 flex gap-1 p-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((slot) => (
                    <div 
                      key={slot} 
                      className="flex-1 rounded bg-muted/20 animate-pulse"
                      style={{ animationDelay: `${(day * 7 + slot) * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton subjects */}
          <div className="mt-6 p-4 rounded-lg border border-border bg-card">
            <div className="w-24 h-6 rounded bg-muted animate-pulse mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-3 rounded-md border-2 border-muted">
                  <div className="w-20 h-4 rounded bg-muted animate-pulse mb-2" />
                  <div className="w-full h-3 rounded bg-muted/50 animate-pulse mb-1" />
                  <div className="w-2/3 h-3 rounded bg-muted/30 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
