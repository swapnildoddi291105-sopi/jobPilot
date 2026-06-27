import { useState } from "react"
import { useJobs } from "@/hooks/useJobs"
import { JobTable } from "@/components/jobs/JobTable"
import { JobFilters } from "@/components/jobs/JobFilters"
import { JobDetailModal } from "@/components/jobs/JobDetailModal"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function JobHistoryPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [source, setSource] = useState("")
  const [selectedJob, setSelectedJob] = useState(null)

  const { data: jobs, isLoading } = useJobs({ search, status, source })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <JobFilters
            search={search}
            status={status}
            source={source}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onSourceChange={setSource}
            onClear={() => {
              setSearch("")
              setStatus("")
              setSource("")
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <JobTable jobs={jobs || []} isLoading={isLoading} onSelectJob={setSelectedJob} />
      )}

      {/* Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  )
}
